import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHmac, generateKeyPairSync, sign } from "node:crypto";
import {
  DurableAuditLog,
  EnvironmentSecretManager,
  FileCollaborationStore,
  FileJobQueue,
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

  const queue = new FileJobQueue(join(tmpdir(), `phase2-${Date.now()}.jsonl`), { maxAttempts: 2, leaseMs: 50 });
  const job = await queue.enqueue("scan", { root: "repo" }, "phase2-job");
  const claimed = await queue.claimNext("worker-1");
  assert.equal(claimed.id, job.id);
  assert.equal((await queue.fail(job.id, "temporary failure")).status, "retrying");
  const retried = await queue.claimNext("worker-2");
  assert.equal(retried.status, "running");
  const finalFailure = await queue.fail(job.id, "persistent failure");
  assert.equal(finalFailure.deadLetter, true);
  assert.equal(finalFailure.status, "failed");

  const security = new SecurityReviewRunner();
  const credential = "ghp_abcdefghijklmnopqrstuvwxyz123456";
  const result = security.scanText(`const token = '${credential}'; const query = \`SELECT * FROM users WHERE id = \${userId}\`;`, "server.js");
  assert.equal(result.findings.length >= 2, true);
  assert.equal(JSON.stringify(result).includes(credential), false);
  assert.equal(result.findings.some((finding) => finding.id === "secret-literal" && finding.summary.includes("credential")), true);
  const customRule = new SecurityReviewRunner([{ id: "custom-secret", severity: "high", pattern: /secret-value-123/, summary: "Custom rule matched." }]);
  assert.equal(JSON.stringify(customRule.scanText("secret-value-123")).includes("secret-value-123"), false);
});
