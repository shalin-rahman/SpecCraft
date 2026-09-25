import { createServer } from "node:http";
import {
  analyzeRepository,
  compileRepositoryContext,
  detectDrift,
  reconstructCandidates
} from "./platform-services.js";
import { AuditLog, RateLimiter } from "./audit-rate-limit.js";
import { createProviderRouter } from "./provider-router.js";
import { validateProviderConfig } from "./provider-config.js";
import { relative, resolve } from "node:path";

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function body(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  if (raw.length > 1_000_000) throw new Error("Request body is too large");
  return raw ? JSON.parse(raw) : {};
}

export function createPlatformServer() {
  let latest = null;
  let proposals = [];
  const audit = new AuditLog();
  const limiter = new RateLimiter({ limit: 60, windowMs: 60_000 });
  const providerRouter = process.env.PROVIDER_CONFIG
    ? createProviderRouter(validateProviderConfig(JSON.parse(process.env.PROVIDER_CONFIG)))
    : null;

  function authorized(request) {
    const expected = process.env.PLATFORM_TOKEN;
    return !expected || request.headers.authorization === "Bearer " + expected;
  }

  function repositoryPath(input) {
    const configuredRoot = resolve(process.env.PLATFORM_REPOSITORY_ROOT ?? process.cwd());
    const requestedRoot = resolve(String(input.root ?? ""));
    const relativePath = relative(configuredRoot, requestedRoot);
    if (relativePath.startsWith("..") || relativePath.includes("..\\") || relativePath === "") {
      throw new Error("Repository path is outside the configured repository root");
    }
    return requestedRoot;
  }

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (request.method === "GET" && url.pathname === "/api/health") {
        return json(response, 200, { status: "ok", service: "speccraft-platform" });
      }
      if (!authorized(request)) return json(response, 401, { error: "Authentication required" });
      const rateKey = request.headers.authorization ?? request.socket.remoteAddress ?? "anonymous";
      if (!limiter.allow(rateKey)) {
        return json(response, 429, { error: "Rate limit exceeded", retryAfterSeconds: 60 });
      }
      if (request.method === "GET" && url.pathname === "/api/findings") {
        return json(response, 200, { revision: latest?.scan.revision ?? null, proposals });
      }
      if (request.method === "GET" && url.pathname === "/api/providers/health") {
        return json(response, 200, {
          configured: providerRouter?.providers.map(({ id, kind, enabled, priority, model }) => ({
            id, kind, enabled, priority, model
          })) ?? []
        });
      }
      if (request.method !== "POST" || !url.pathname.startsWith("/api/")) {
        return json(response, 404, { error: "Not found" });
      }

      const input = await body(request);
      if (url.pathname === "/api/scan") {
        latest = await analyzeRepository(repositoryPath(input));
        return json(response, 200, latest);
      }
      if (url.pathname === "/api/reconstruct") {
        if (!latest) return json(response, 409, { error: "Scan a repository first" });
        return json(response, 200, { candidates: reconstructCandidates(latest) });
      }
      if (url.pathname === "/api/drift") {
        if (!latest) return json(response, 409, { error: "Scan a repository first" });
        return json(response, 200, detectDrift(latest, await analyzeRepository(repositoryPath(input))));
      }
      if (url.pathname === "/api/context") {
        if (!latest) return json(response, 409, { error: "Scan a repository first" });
        return json(response, 200, compileRepositoryContext(latest, input.query));
      }
      if (url.pathname === "/api/providers/complete") {
        if (!providerRouter) return json(response, 503, { error: "Provider configuration is not loaded" });
        const result = await providerRouter.complete(input);
        audit.append({ actor: "provider-router", action: "provider.complete", result: result.providerId });
        return json(response, 200, result);
      }
      if (url.pathname === "/api/proposals") {
        if (!latest) return json(response, 409, { error: "Scan a repository first" });
        if (input.expectedRevision !== latest.scan.revision) {
          return json(response, 409, { error: "Revision conflict: scan the repository again" });
        }
        const proposal = {
          id: `PROP-${proposals.length + 1}`,
          operation: input.operation,
          evidence: Array.isArray(input.evidence) ? input.evidence : [],
          expectedRevision: input.expectedRevision,
          status: "pending-review",
          createdAt: new Date().toISOString()
        };
        proposals = [...proposals, proposal];
        audit.append({
          actor: input.actor ?? "unknown",
          action: "proposal.created",
          project: input.project ?? "default",
          revision: input.expectedRevision,
          result: proposal.id
        });
        return json(response, 202, proposal);
      }
      return json(response, 404, { error: "Unknown API route" });
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : "Request failed" });
    }
  });
}
