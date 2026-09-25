import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import { createPlatformServer, isLoopbackAddress } from "../src/platform-http.js";

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function fetchStatus(url, options) {
  const response = await fetch(url, options);
  await response.arrayBuffer();
  return response.status;
}

function postChunked(baseUrl, path, chunks) {
  const target = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      hostname: target.hostname,
      port: target.port,
      path,
      method: "POST",
      headers: { "content-type": "application/json" }
    }, (response) => {
      const parts = [];
      response.on("data", (chunk) => parts.push(chunk));
      response.on("end", () => resolve({
        status: response.statusCode,
        body: JSON.parse(Buffer.concat(parts).toString("utf8"))
      }));
    });
    request.on("error", reject);
    for (const chunk of chunks) request.write(chunk);
    request.end();
  });
}

test("HTTP scan, reconstruction, context, drift, and proposal routes expose reference behavior", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-http-"));
  const repository = join(root, "repository");
  await mkdir(repository);
  await writeFile(join(repository, "membership.js"), "export function closeMembership() {}\n");
  const previousRepositoryRoot = process.env.PLATFORM_REPOSITORY_ROOT;
  const previousToken = process.env.PLATFORM_TOKEN;
  process.env.PLATFORM_REPOSITORY_ROOT = repository;
  delete process.env.PLATFORM_TOKEN;
  const server = createPlatformServer();

  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const post = async (path, value) => {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value)
      });
      return { status: response.status, body: await response.json() };
    };

    const outOfScope = await post("/api/scan", { root: tmpdir() });
    assert.equal(outOfScope.status, 400);
    assert.match(outOfScope.body.error, /outside the configured repository root/);

    if (process.platform === "win32") {
      const otherDrive = repository.slice(0, 1).toUpperCase() === "C" ? "D:" : "C:";
      const crossDrive = await post("/api/scan", { root: `${otherDrive}\\outside` });
      assert.equal(crossDrive.status, 400);
      assert.match(crossDrive.body.error, /outside the configured repository root/);
    }

    const scan = await post("/api/scan", { root: repository });
    assert.equal(scan.status, 200);
    assert.equal(scan.body.graph.nodes.some((node) => node.name === "closeMembership"), true);

    const candidates = await post("/api/reconstruct", {});
    assert.equal(candidates.body.candidates[0].reviewState, "candidate");
    const context = await post("/api/context", { query: "closeMembership" });
    assert.equal(context.body.nodes[0].name, "closeMembership");

    const proposal = await post("/api/proposals", {
      expectedRevision: scan.body.scan.revision,
      operation: { type: "review" },
      evidence: ["membership.js:1"]
    });
    assert.equal(proposal.status, 202);
    assert.equal(proposal.body.status, "pending-review");

    await writeFile(join(repository, "membership.js"), "export function reopenMembership() {}\n");
    const drift = await post("/api/drift", { root: repository });
    assert.deepEqual(drift.body.changed, ["membership.js"]);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousRepositoryRoot === undefined) delete process.env.PLATFORM_REPOSITORY_ROOT;
    else process.env.PLATFORM_REPOSITORY_ROOT = previousRepositoryRoot;
    if (previousToken === undefined) delete process.env.PLATFORM_TOKEN;
    else process.env.PLATFORM_TOKEN = previousToken;
    await rm(root, { recursive: true, force: true });
  }
});

test("HTTP API applies loopback and configured-token authentication", async () => {
  const previousToken = process.env.PLATFORM_TOKEN;
  delete process.env.PLATFORM_TOKEN;
  const server = createPlatformServer({ rateLimitLimit: 20 });
  try {
    const baseUrl = await listen(server);
    assert.equal(isLoopbackAddress("127.0.0.1"), true);
    assert.equal(isLoopbackAddress("::1"), true);
    assert.equal(isLoopbackAddress("::ffff:127.0.0.4"), true);
    assert.equal(isLoopbackAddress("192.168.1.4"), false);
    assert.equal(await fetchStatus(`${baseUrl}/api/findings`), 200);

    process.env.PLATFORM_TOKEN = "configured-token";
    assert.equal(await fetchStatus(`${baseUrl}/api/findings`, { headers: { authorization: "Bearer wrong-token" } }), 401);
    assert.equal(await fetchStatus(`${baseUrl}/api/findings`, { headers: { authorization: "Bearer configured-token" } }), 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousToken === undefined) delete process.env.PLATFORM_TOKEN;
    else process.env.PLATFORM_TOKEN = previousToken;
  }
});

test("HTTP API bounds chunked bodies, caller-controlled rate keys, and proposal state", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-http-limits-"));
  const repository = join(root, "repository");
  await mkdir(repository);
  await writeFile(join(repository, "entry.js"), "export const ready = true;\n");
  const previousRepositoryRoot = process.env.PLATFORM_REPOSITORY_ROOT;
  const previousToken = process.env.PLATFORM_TOKEN;
  process.env.PLATFORM_REPOSITORY_ROOT = repository;
  delete process.env.PLATFORM_TOKEN;
  const server = createPlatformServer({ maxBodyBytes: 8, maxProposals: 1, rateLimitLimit: 100 });

  try {
    const baseUrl = await listen(server);
    const oversized = await postChunked(baseUrl, "/api/scan", ["{\"root\"", ":\"", "repository\"}"]);
    assert.equal(oversized.status, 413);
    assert.match(oversized.body.error, /too large/i);

    const normalServer = createPlatformServer({ rateLimitLimit: 2 });
    try {
      const normalUrl = await listen(normalServer);
      assert.equal(await fetchStatus(`${normalUrl}/api/findings`, { headers: { authorization: "Bearer caller-choice-1" } }), 200);
      assert.equal(await fetchStatus(`${normalUrl}/api/findings`, { headers: { authorization: "Bearer caller-choice-2" } }), 200);
      assert.equal(await fetchStatus(`${normalUrl}/api/findings`, { headers: { authorization: "Bearer caller-choice-3" } }), 429);
    } finally {
      await new Promise((resolve) => normalServer.close(resolve));
    }

    const proposalServer = createPlatformServer({ maxProposals: 1, rateLimitLimit: 100 });
    try {
      const proposalUrl = await listen(proposalServer);
      const post = async (path, value) => {
        const response = await fetch(`${proposalUrl}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(value)
        });
        return { status: response.status, body: await response.json() };
      };
      const scan = await post("/api/scan", { root: repository });
      assert.equal(scan.status, 200);
      const payload = { expectedRevision: scan.body.scan.revision, operation: { type: "review" }, evidence: ["entry.js:1"] };
      assert.equal((await post("/api/proposals", payload)).status, 202);
      const overflow = await post("/api/proposals", payload);
      assert.equal(overflow.status, 503);
      const findings = await fetch(`${proposalUrl}/api/findings`);
      assert.equal((await findings.json()).proposals.length, 1);
    } finally {
      await new Promise((resolve) => proposalServer.close(resolve));
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previousRepositoryRoot === undefined) delete process.env.PLATFORM_REPOSITORY_ROOT;
    else process.env.PLATFORM_REPOSITORY_ROOT = previousRepositoryRoot;
    if (previousToken === undefined) delete process.env.PLATFORM_TOKEN;
    else process.env.PLATFORM_TOKEN = previousToken;
    await rm(root, { recursive: true, force: true });
  }
});
