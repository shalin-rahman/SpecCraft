import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DurableAuditLog,
  EnvironmentSecretManager,
  FileCollaborationStore,
  FileJobQueue,
  ManagedAuthorizationService,
  ManagedDatabaseAdapter,
  ManagedIdentityProvider,
  VaultSecretProvider,
  DistributedRateLimiter,
  SecurityReviewRunner
} from "../src/production-infrastructure.js";
import { ParserRegistry } from "../src/parser-adapter.js";
import { evaluateLabels } from "../src/benchmark.js";

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

  const identity = new ManagedIdentityProvider({
    issuer: "https://issuer.example.com",
    audience: "speccraft-app",
    jwksUrl: "https://issuer.example.com/.well-known/jwks.json",
    requiredTenant: "tenant-1"
  });
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaXNzIjoiaHR0cHM6Ly9pc3N1ZXIuZXhhbXBsZS5jb20iLCJhdWQiOiJzcGVjY3JhZnQtYXBwIiwidGVuYW50IjoidGVuYW50LTEiLCJyb2xlcyI6WyJ1c2VyIl0sInNjb3BlcyI6WyJwcm9qZWN0OnJlYWQiXSwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjM3MDAwMDAwMDB9.7mVQ7NQf2nR3I6YVQZ09t3n4iW2L9kKk2I3a7s_7e8k";
  assert.equal(identity.verifyToken(token).subject, "1234567890");

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
  const result = security.scanText("const token = 'ghp_abcd'; const query = `SELECT * FROM users WHERE id = ${userId}`;", "server.js");
  assert.equal(result.findings.length >= 2, true);
});
