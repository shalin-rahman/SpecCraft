import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DurableAuditLog,
  EnvironmentSecretManager,
  FileCollaborationStore,
  FileJobQueue
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
