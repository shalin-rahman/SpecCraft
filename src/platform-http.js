import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  analyzeRepository,
  compileRepositoryContext,
  detectDrift,
  reconstructCandidates
} from "./platform-services.js";
import { AuditLog, RateLimiter } from "./audit-rate-limit.js";
import { createProviderRouter } from "./provider-router.js";
import { validateProviderConfig } from "./provider-config.js";
import { isAbsolute, relative, resolve, sep } from "node:path";

const DEFAULT_MAX_BODY_BYTES = 1_000_000;
const DEFAULT_MAX_PROPOSALS = 1_000;
const DEFAULT_RATE_LIMIT = 60;
const DEFAULT_RATE_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_BUCKETS = 10_000;

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function body(request, maxBytes) {
  const declaredLength = Number(request.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    request.resume();
    throw httpError(413, "Request body is too large");
  }

  const chunks = [];
  let totalBytes = 0;
  let oversized = false;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      oversized = true;
      chunks.length = 0;
      continue;
    }
    if (!oversized) chunks.push(chunk);
  }
  if (oversized) throw httpError(413, "Request body is too large");
  const raw = Buffer.concat(chunks, totalBytes).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function isLoopbackAddress(address) {
  if (typeof address !== "string") return false;
  const normalized = address.toLowerCase();
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
  const ipv4 = normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
  const octets = ipv4.split(".");
  return octets.length === 4 && octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255) && Number(octets[0]) === 127;
}

function safeTokenMatches(candidate, expected) {
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export function createPlatformServer({
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  maxProposals = DEFAULT_MAX_PROPOSALS,
  rateLimitLimit = DEFAULT_RATE_LIMIT,
  rateLimitWindowMs = DEFAULT_RATE_WINDOW_MS,
  rateLimitMaxEntries = DEFAULT_RATE_LIMIT_BUCKETS
} = {}) {
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes < 1 ||
      !Number.isSafeInteger(maxProposals) || maxProposals < 1) {
    throw new RangeError("HTTP body and proposal limits must be positive safe integers");
  }
  let latest = null;
  let proposals = [];
  const audit = new AuditLog();
  const limiter = new RateLimiter({
    limit: rateLimitLimit,
    windowMs: rateLimitWindowMs,
    maxEntries: rateLimitMaxEntries
  });
  const providerRouter = process.env.PROVIDER_CONFIG
    ? createProviderRouter(validateProviderConfig(JSON.parse(process.env.PROVIDER_CONFIG)))
    : null;

  function authorized(request) {
    const expected = process.env.PLATFORM_TOKEN;
    if (!expected) return isLoopbackAddress(request.socket.remoteAddress);
    const authorization = request.headers.authorization;
    if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return false;
    return safeTokenMatches(authorization.slice(7), expected);
  }

  function repositoryPath(input) {
    const configuredRoot = resolve(process.env.PLATFORM_REPOSITORY_ROOT ?? process.cwd());
    const requestedRoot = resolve(String(input.root ?? ""));
    const relativePath = relative(configuredRoot, requestedRoot);
    if (isAbsolute(relativePath) || relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
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
      const rateKey = request.socket.remoteAddress ?? "unknown";
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

      const input = await body(request, maxBodyBytes);
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
        if (proposals.length >= maxProposals) {
          return json(response, 503, { error: "Proposal capacity reached" });
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
      return json(response, error?.statusCode ?? 400, { error: error instanceof Error ? error.message : "Request failed" });
    }
  });
}
