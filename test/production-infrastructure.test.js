import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHmac, generateKeyPairSync, sign } from "node:crypto";
import {
  DurableAuditLog,
  EnvironmentSecretManager,
  FileCollaborationStore,
  FileJobQueue,
  ProjectRepository,
  ManagedOutbox,
  ManagedAuthorizationService,
  ManagedDatabaseAdapter,
  ManagedIdentityService,
  ManagedIdentityProvider,
  VaultSecretProvider,
  DistributedRateLimiter,
  SecurityReviewRunner
} from "../src/production-infrastructure.js";
import { ParserRegistry } from "../src/parser-adapter.js";
import { evaluateLabels } from "../src/benchmark.js";

function makeJwt(header, payload, signer) {
  const signingInput = [header, payload]
    .map((value) => Buffer.from(JSON.stringify(value)).toString("base64url"))
    .join(".");
  const signature = signer ? signer(signingInput).toString("base64url") : "";
  return `${signingInput}.${signature}`;
}

function identityClaims(overrides = {}) {
  return {
    sub: "user-123",
    iss: "https://issuer.example.com",
    aud: "speccraft-app",
    tenant: "tenant-1",
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides
  };
}

test("durable audit records survive reload and verify", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  const path = join(root, "audit.jsonl");
  try {
    const first = new DurableAuditLog(path);
    await first.append({ action: "scan", actor: "test" });
    await first.append({ action: "context", actor: "test" });
    const second = new DurableAuditLog(path);
    assert.equal((await second.list()).length, 2);
    assert.equal(await second.verify(), true);

    const concurrentLogs = Array.from({ length: 8 }, () => new DurableAuditLog(path));
    await Promise.all(concurrentLogs.map((log, index) => log.append({ action: `concurrent-${index}` })));
    const protectedRecord = await second.append({
      action: "caller-metadata",
      sequence: 900,
      previousHash: "caller-controlled",
      hash: "caller-controlled"
    });
    const records = await second.list();
    assert.deepEqual(records.map(({ sequence }) => sequence), Array.from({ length: 11 }, (_, index) => index + 1));
    assert.equal(protectedRecord.sequence, 11);
    assert.equal(protectedRecord.previousHash, records[9].hash);
    assert.equal(await second.verify(), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local infrastructure rejects stale collaboration writes and resolves secrets", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  try {
    const store = new FileCollaborationStore(join(root, "collaboration.json"));
    await store.propose({ expectedRevision: 0, actor: "test", proposal: "one" });
    await assert.rejects(() => store.propose({ expectedRevision: 0, actor: "test", proposal: "stale" }), /Revision conflict/);
    assert.equal(new EnvironmentSecretManager({ TOKEN: "value" }).resolve("TOKEN"), "value");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("queue, parser registry, and labelled evaluation expose explicit results", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  try {
    const queue = new FileJobQueue(join(root, "jobs.jsonl"));
    await queue.enqueue("scan", { root: "repo" }, "scan-1");
    assert.equal((await queue.list())[0].idempotencyKey, "scan-1");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  const registry = new ParserRegistry();
  assert.equal(registry.parse({ language: "rust" }).symbols.length, 0);
  assert.deepEqual(evaluateLabels(["a", "b"], ["b", "c"]), {
    truePositive: 1, falsePositive: 1, falseNegative: 1, precision: 0.5, recall: 0.5
  });
});

test("managed identity provider rejects incomplete or ambiguous configuration", () => {
  assert.throws(() => new ManagedIdentityProvider({ signingSecret: "secret" }), /issuer and audience/i);
  assert.throws(() => new ManagedIdentityProvider({ issuer: "https://issuer.example.com", signingSecret: "secret" }), /issuer and audience/i);
  assert.throws(() => new ManagedIdentityProvider({ issuer: "https://issuer.example.com", audience: "app" }), /exactly one/i);
  assert.throws(() => new ManagedIdentityProvider({
    issuer: "https://issuer.example.com", audience: "app", signingSecret: "secret",
    jwksUrl: "https://issuer.example.com/jwks"
  }), /exactly one/i);
  assert.doesNotThrow(() => new ManagedIdentityProvider({
    issuer: "https://issuer.example.com", audience: "app", signingSecret: "secret"
  }));
});

test("file stores recover malformed stale queue locks and protect predictable temp paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  try {
    const queuePath = join(root, "jobs.jsonl");
    const lockPath = `${queuePath}.lock`;
    await writeFile(lockPath, "{truncated", "utf8");
    const old = new Date(Date.now() - 2_000);
    await utimes(lockPath, old, old);
    const queue = new FileJobQueue(queuePath, { lockStaleMs: 20, lockTimeoutMs: 500 });
    await queue.enqueue("scan", { root: "repo" }, "after-crash");
    assert.equal((await queue.list()).length, 1);
    await assert.rejects(() => readFile(lockPath), { code: "ENOENT" });

    const collaborationPath = join(root, "collaboration.json");
    const predictableTempPath = `${collaborationPath}.tmp`;
    await writeFile(predictableTempPath, "keep this file", "utf8");
    const stores = [new FileCollaborationStore(collaborationPath), new FileCollaborationStore(collaborationPath)];
    const outcomes = await Promise.allSettled(stores.map((store, index) =>
      store.propose({ expectedRevision: 0, actor: "test", proposal: `proposal-${index}` })));
    assert.equal(outcomes.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(outcomes.filter((result) => result.status === "rejected" && /Revision conflict/.test(result.reason.message)).length, 1);
    assert.equal(await readFile(predictableTempPath, "utf8"), "keep this file");
    assert.equal((await new FileCollaborationStore(collaborationPath).read()).proposals.length, 1);

    const projectPath = join(root, "projects.json");
    const repositories = [new ProjectRepository(projectPath), new ProjectRepository(projectPath)];
    await Promise.all(repositories.map((repository, index) => repository.createProject({ id: `project-${index}` })));
    assert.deepEqual((await repositories[0].listProjects()).map(({ id }) => id).sort(), ["project-0", "project-1"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("managed stack adapters implement production contracts and protective controls", async () => {
  const database = new ManagedDatabaseAdapter({
    connectionString: "postgresql://user:pass@db.internal:5432/speccraft",
    tableName: "projects"
  });
  assert.equal(database.tableName, "projects");
  assert.ok(database.migrationPlan().columns.includes("owner"));

  const project = await database.createProject({ id: "demo", name: "Demo", owner: "tenant-1" });
  assert.equal(project.id, "demo");
  const revision = await database.saveRevision("demo", { type: "scan", summary: "first" });
  assert.equal(revision.revisionId, 1);

  await assert.rejects(() => database.createProject({ id: "demo", name: "dup" }), /already exists/i);

  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "signing-key-1", alg: "RS256", use: "sig" };
  let fetchOptions;
  let fetchCount = 0;
  const identity = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/.well-known/jwks.json",
    requiredTenant: "tenant-1",
    fetchImpl: async (_url, options) => {
      fetchCount += 1;
      fetchOptions = options;
      return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
    }
  });
  const makeRsaToken = (claims = identityClaims(), keyId = "signing-key-1", algorithm = "RS256") =>
    makeJwt({ alg: algorithm, kid: keyId, typ: "JWT" }, claims, (input) =>
      sign("RSA-SHA256", Buffer.from(input), privateKey));
  const token = makeRsaToken();
  assert.equal((await identity.verifyToken(token)).subject, "user-123");
  assert.equal(fetchOptions.redirect, "error");
  assert.ok(fetchOptions.signal instanceof AbortSignal);
  assert.equal(await identity.verifyToken(token).then((principal) => principal.subject), "user-123");
  assert.equal(fetchCount, 1);

  const signatureStart = token.lastIndexOf(".") + 1;
  const forged = token.slice(0, signatureStart) + (token[signatureStart] === "A" ? "B" : "A") + token.slice(signatureStart + 1);
  await assert.rejects(identity.verifyToken(forged), /signature/i);
  await assert.rejects(identity.verifyToken(makeJwt({ alg: "none", typ: "JWT" }, identityClaims())), /algorithm/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims(), "unknown-key")), /key/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims(), "signing-key-1", "RS512")), /algorithm/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims({ exp: Math.floor(Date.now() / 1000) - 3600 }))), /expired/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims({ nbf: Math.floor(Date.now() / 1000) + 3600 }))), /not yet valid/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims({ iss: "https://wrong.example.com" }))), /issuer/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims({ aud: "another-app" }))), /audience/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims({ tenant: "tenant-2" }))), /tenant/i);
  await assert.rejects(identity.verifyToken(makeRsaToken(identityClaims({ exp: undefined }))), /expiration/i);

  const validSecret = "test-secret-not-for-production";
  const hmacIdentity = new ManagedIdentityService({ issuer: "https://issuer.example.com", audience: "speccraft-app", signingSecret: validSecret });
  const hmacToken = makeJwt({ alg: "HS256", typ: "JWT" }, identityClaims(), (input) =>
    createHmac("sha256", validSecret).update(input).digest());
  assert.equal(hmacIdentity.verifyToken(hmacToken).subject, "user-123");
  assert.throws(() => new ManagedIdentityService().verifyToken(makeJwt({ alg: "none" }, identityClaims())), /algorithm/i);
  assert.throws(() => new ManagedIdentityService().verifyToken(makeJwt({ alg: "HS256" }, identityClaims(), () => Buffer.alloc(32))), /verification key/i);
  assert.throws(() => new ManagedIdentityService({ signingSecret: validSecret }).verifyToken(makeJwt({ alg: "HS512" }, identityClaims())), /algorithm/i);
  assert.throws(() => new ManagedIdentityProvider({ issuer: "https://issuer.example.com", audience: "speccraft-app", jwksUrl: "http://issuer.example.com/jwks" }), /HTTPS/i);

  const tooManyKeys = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/jwks",
    fetchImpl: async () => new Response(JSON.stringify({ keys: Array.from({ length: 101 }, (_, index) => ({ ...jwk, kid: `key-${index}` })) }))
  });
  await assert.rejects(tooManyKeys.verifyToken(token), /key set/i);
  const duplicateKeyIds = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/jwks",
    fetchImpl: async () => new Response(JSON.stringify({ keys: [jwk, { ...jwk, n: "different" }] }))
  });
  await assert.rejects(duplicateKeyIds.verifyToken(token), /duplicate/i);
  const tooLargeJwks = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/jwks",
    fetchImpl: async () => new Response(`{"keys":[],"padding":"${"x".repeat(256 * 1024)}"}`)
  });
  await assert.rejects(tooLargeJwks.verifyToken(token), /too large/i);
  const redirectedJwks = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/jwks",
    fetchImpl: async () => new Response(null, { status: 302 })
  });
  await assert.rejects(redirectedJwks.verifyToken(token), /JWKS/i);
  const unavailableJwks = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/jwks",
    fetchImpl: async () => { throw new Error("offline"); }
  });
  await assert.rejects(unavailableJwks.verifyToken(token), /JWKS/i);

  const authz = new ManagedAuthorizationService({ requiredTenant: "tenant-1" });
  assert.equal(authz.authorize({ tenant: "tenant-1", project: "demo", roles: ["user"], scopes: ["project:read"] }, { projectId: "demo", roles: ["user"], scopes: ["project:read"] }), true);
  assert.equal(authz.authorize({ tenant: "tenant-2", project: "demo", roles: ["user"], scopes: ["project:read"] }, { projectId: "demo" }), false);

  const secretProvider = new VaultSecretProvider({
    environment: { SPECCRAFT_API_KEY: "super-secret" }
  });
  assert.equal(secretProvider.resolve("API_KEY"), "super-secret");
  secretProvider.rotate("API_KEY", "rotated-secret");
  assert.equal(secretProvider.resolve("API_KEY"), "rotated-secret");
  secretProvider.revoke("API_KEY");
  assert.throws(() => secretProvider.resolve("API_KEY"), /Secret is not available/);
  assert.equal(secretProvider.redact("super-secret"), "[REDACTED]");

  const limiter = new DistributedRateLimiter({ windowMs: 1000, maxRequests: 2 });
  assert.equal(limiter.allow("user-1").allowed, true);
  assert.equal(limiter.allow("user-1").allowed, true);
  assert.equal(limiter.allow("user-1").allowed, false);

  const queueRoot = await mkdtemp(join(tmpdir(), "speccraft-queue-test-"));
  try {
    const queue = new FileJobQueue(join(queueRoot, "queue.jsonl"), { maxAttempts: 2, leaseMs: 50 });
    const job = await queue.enqueue("scan", { root: "repo" }, "phase2-job");
    const claimed = await queue.claimNext("worker-1");
    assert.equal(claimed.id, job.id);
    assert.equal((await queue.fail(job.id, "temporary failure", claimed.leaseToken)).status, "retrying");
    const retried = await queue.claimNext("worker-2");
    assert.equal(retried.status, "running");
    const finalFailure = await queue.fail(job.id, "persistent failure", retried.leaseToken);
    assert.equal(finalFailure.deadLetter, true);
    assert.equal(finalFailure.status, "failed");
  } finally {
    await rm(queueRoot, { recursive: true, force: true });
  }

  const security = new SecurityReviewRunner();
  const credential = "ghp_abcdefghijklmnopqrstuvwxyz123456";
  const result = security.scanText(`const token = '${credential}'; const query = \`SELECT * FROM users WHERE id = \${userId}\`;`, "server.js");
  assert.equal(result.findings.length >= 2, true);
  assert.equal(JSON.stringify(result).includes(credential), false);
  assert.equal(result.findings.some((finding) => finding.id === "secret-literal" && finding.summary.includes("credential")), true);
  const customRule = new SecurityReviewRunner([{ id: "custom-secret", severity: "high", pattern: /secret-value-123/, summary: "Custom rule matched." }]);
  assert.equal(JSON.stringify(customRule.scanText("secret-value-123")).includes("secret-value-123"), false);
});

test("file queue serializes claims and rejects stale lease updates", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-queue-concurrency-"));
  try {
    const path = join(root, "queue.jsonl");
    const firstQueue = new FileJobQueue(path, { leaseMs: 1_000 });
    const secondQueue = new FileJobQueue(path, { leaseMs: 1_000 });
    await firstQueue.enqueue("scan", { root: "one" }, "one");
    await firstQueue.enqueue("scan", { root: "two" }, "two");
    const claims = await Promise.all([
      firstQueue.claimNext("worker-a"),
      secondQueue.claimNext("worker-b")
    ]);
    assert.notEqual(claims[0].id, claims[1].id);
    assert.notEqual(claims[0].leaseToken, claims[1].leaseToken);

    const leasePath = join(root, "lease-queue.jsonl");
    const leaseQueue = new FileJobQueue(leasePath, { leaseMs: 10 });
    const queued = await leaseQueue.enqueue("scan", {}, "lease-case");
    const oldLease = await leaseQueue.claimNext("old-worker");
    await new Promise((resolve) => setTimeout(resolve, 25));
    const currentLease = await leaseQueue.claimNext("new-worker");
    assert.equal(currentLease.id, queued.id);
    await assert.rejects(leaseQueue.complete(queued.id, { ok: true }, oldLease.leaseToken), /stale lease/i);
    await assert.rejects(leaseQueue.fail(queued.id, "late failure", oldLease.leaseToken), /stale lease/i);
    assert.equal((await leaseQueue.complete(queued.id, { ok: true }, currentLease.leaseToken)).status, "completed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("file queue recovers a stale lock only when its recorded owner is gone", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-queue-stale-lock-"));
  try {
    const path = join(root, "queue.jsonl");
    const staleLock = `${path}.lock`;
    const staleQueue = new FileJobQueue(path, { lockStaleMs: 20, lockTimeoutMs: 100 });
    await writeFile(staleLock, JSON.stringify({ pid: 2_147_483_647, token: "abandoned" }));
    const old = new Date(Date.now() - 1_000);
    await utimes(staleLock, old, old);
    await staleQueue.enqueue("scan", {}, "recover-stale-lock");
    assert.equal((await staleQueue.list()).length, 1);

    const liveLock = `${path}.lock`;
    await writeFile(liveLock, JSON.stringify({ pid: process.pid, token: "live" }));
    const liveOld = new Date(Date.now() - 1_000);
    await utimes(liveLock, liveOld, liveOld);
    await assert.rejects(staleQueue.enqueue("scan", {}, "must-not-break-live-lock"), /Timed out waiting/);
    assert.equal(JSON.parse(await readFile(liveLock, "utf8")).token, "live");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("managed outbox claims jobs before calling handlers", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-outbox-test-"));
  try {
    const outbox = new ManagedOutbox(join(root, "outbox.jsonl"));
    const queued = await outbox.publish("sync", { revision: 1 }, "sync-1");
    const drained = await outbox.drain(async (job) => {
      assert.equal(job.id, queued.id);
      assert.equal(typeof job.leaseToken, "string");
      return { accepted: true };
    });
    assert.equal(drained[0].status, "completed");
    assert.deepEqual(drained[0].output, { accepted: true });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("managed outbox does not retry the same job repeatedly in one drain", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-outbox-retry-"));
  try {
    const outbox = new ManagedOutbox(join(root, "outbox.jsonl"));
    await outbox.publish("sync", {}, "sync-retry");
    let attempts = 0;
    const drained = await outbox.drain(async () => {
      attempts += 1;
      throw new Error("temporary outage");
    });
    assert.equal(attempts, 1);
    assert.equal(drained[0].status, "retrying");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
