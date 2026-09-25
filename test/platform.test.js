import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  analyzeRepository,
  compileRepositoryContext,
  detectDrift,
  reconstructCandidates
} from "../src/platform-services.js";
import { KnowledgeStore, RevisionConflictError } from "../src/synchronization.js";

test("scans supported source files and extracts graph symbols", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  try {
    await writeFile(join(root, "sample.js"), "export function closeMembership() {}\nclass Member {}\n");
    await writeFile(join(root, ".env"), "TOKEN=do-not-read");
    const analysis = await analyzeRepository(root);
    const symbolNames = analysis.graph.nodes
      .filter((node) => node.type === "symbol")
      .map((node) => node.name);

    assert.deepEqual(symbolNames.sort(), ["Member", "closeMembership"]);
    assert.equal(analysis.scan.files.some((file) => file.path === ".env"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reconstructs candidates with provenance and detects drift", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  try {
    await writeFile(join(root, "service.py"), "def close_membership():\n    pass\n");
    const previous = await analyzeRepository(root);
    const candidates = reconstructCandidates(previous);
    assert.equal(candidates[0].reviewState, "candidate");
    assert.equal(candidates[0].confidence, "low");

    await writeFile(join(root, "service.py"), "def reopen_membership():\n    pass\n");
    const current = await analyzeRepository(root);
    const drift = detectDrift(previous, current);
    assert.deepEqual(drift.changed, ["service.py"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("compiles query context from graph nodes and edges", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-"));
  try {
    await writeFile(join(root, "membership.js"), "export function closeMembership() {}\n");
    const analysis = await analyzeRepository(root);
    const context = compileRepositoryContext(analysis, "closeMembership");
    assert.equal(context.nodes[0].name, "closeMembership");
    assert.equal(context.edges.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("applies revisioned synchronization proposals and rejects stale writers", () => {
  const store = new KnowledgeStore({ requirements: [] });
  const first = store.apply({
    type: "requirement.added",
    actor: "reviewer",
    expectedRevision: 0,
    evidence: ["requirements.md"],
    operation: {
      type: "append",
      path: "requirements",
      value: { id: "REQ-001" }
    }
  });

  assert.equal(first.revision, 1);
  assert.equal(first.state.requirements.length, 1);
  assert.throws(
    () =>
      store.apply({
        expectedRevision: 0,
        operation: { type: "append", path: "requirements", value: { id: "REQ-002" } }
      }),
    RevisionConflictError
  );
  assert.throws(
    () => store.apply({ expectedRevision: 1, apply: () => ({}) }),
    /typed append operation/
  );
});
