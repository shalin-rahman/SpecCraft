import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeTraceability,
  createKnowledgeGraph,
  createKnowledgeNode,
  transitionReviewState,
  traverseKnowledgeGraph
} from "../src/knowledge-graph.js";

test("validates typed graph nodes, relationships, and endpoints", () => {
  assert.throws(() => createKnowledgeNode({ id: "x", type: "mystery" }), /Unsupported knowledge node type/);
  assert.throws(() => createKnowledgeGraph({
    nodes: [{ id: "REQ-1", type: "requirement" }],
    edges: [{ from: "REQ-1", to: "missing", type: "implements" }]
  }), /missing endpoint/);
  assert.throws(() => createKnowledgeGraph({
    nodes: [{ id: "REQ-1", type: "requirement" }, { id: "CODE-1", type: "function" }],
    edges: [
      { from: "REQ-1", to: "CODE-1", type: "implements" },
      { from: "REQ-1", to: "CODE-1", type: "implements" }
    ]
  }), /Duplicate knowledge edge/);
});

test("traverses deterministic paths and preserves relationship evidence", () => {
  const graph = createKnowledgeGraph({
    revision: "r1",
    nodes: [
      { id: "REQ-1", type: "requirement", reviewState: "canonical" },
      { id: "RULE-1", type: "rule", evidence: ["rules.md#1"] },
      { id: "CODE-1", type: "function", confidence: "high" },
      { id: "TEST-1", type: "test" }
    ],
    edges: [
      { from: "REQ-1", to: "RULE-1", type: "governed-by", evidence: ["spec.md#4"] },
      { from: "RULE-1", to: "CODE-1", type: "implemented-by" },
      { from: "CODE-1", to: "TEST-1", type: "verified-by", confidence: "high" }
    ]
  });

  const result = traverseKnowledgeGraph(graph, "REQ-1");
  const testPath = result.find((item) => item.id === "TEST-1");
  assert.deepEqual(testPath.path, ["REQ-1", "RULE-1", "CODE-1", "TEST-1"]);
  assert.deepEqual(testPath.relationships.map((edge) => edge.type), [
    "governed-by", "implemented-by", "verified-by"
  ]);
  assert.deepEqual(testPath.evidence, ["spec.md#4", "rules.md#1"]);
  assert.equal(traverseKnowledgeGraph(graph, "CODE-1", { direction: "incoming" })[0].id, "RULE-1");
});

test("reports implementation and verification coverage with evidence paths", () => {
  const graph = createKnowledgeGraph({
    revision: "r2",
    nodes: [
      { id: "REQ-1", type: "requirement" },
      { id: "CODE-1", type: "function" },
      { id: "TEST-1", type: "test" },
      { id: "REQ-2", type: "requirement" }
    ],
    edges: [
      { from: "REQ-1", to: "CODE-1", type: "implemented-by", evidence: ["src/a.js:1"] },
      { from: "CODE-1", to: "TEST-1", type: "verified-by", evidence: ["test/a.test.js:1"] }
    ]
  });
  const coverage = analyzeTraceability(graph);

  assert.equal(coverage.requirements[0].implemented, true);
  assert.equal(coverage.requirements[0].verified, true);
  assert.deepEqual(coverage.requirements[0].evidence, ["src/a.js:1", "test/a.test.js:1"]);
  assert.deepEqual(coverage.unimplemented, ["REQ-2"]);
  assert.deepEqual(coverage.unverified, ["REQ-2"]);
});

test("requires evidence and human approval before canonicalization", () => {
  const candidate = createKnowledgeNode({ id: "CAND-1", type: "requirement", reviewState: "candidate" });
  const inReview = transitionReviewState(candidate, "under_review", {
    actor: "reviewer-1",
    reason: "Inspecting source evidence"
  });
  const accepted = transitionReviewState(inReview, "accepted", {
    actor: "reviewer-1",
    reason: "Candidate is supported"
  });
  const proposed = transitionReviewState(accepted, "proposed", {
    actor: "reviewer-1",
    reason: "Submit for approval"
  });
  const approved = transitionReviewState(proposed, "approved", {
    actor: "product-owner",
    reason: "Approved after review",
    evidence: ["decision:42"]
  });

  assert.throws(() => transitionReviewState(approved, "canonical", {
    actor: "agent-1",
    actorType: "agent",
    reason: "Promote",
    evidence: ["decision:42"]
  }), /explicit human decision/);
  assert.throws(() => transitionReviewState(approved, "canonical", {
    actor: "product-owner",
    reason: "Promote"
  }), /requires evidence/);
  const canonical = transitionReviewState(approved, "canonical", {
    actor: "product-owner",
    reason: "Promote approved knowledge",
    evidence: ["decision:42"]
  });
  assert.equal(canonical.reviewState, "canonical");
  assert.equal(canonical.reviewHistory.length, 5);
  assert.throws(() => transitionReviewState(canonical, "candidate", {
    actor: "reviewer-1",
    reason: "Invalid backward transition"
  }), /Invalid review transition/);
});
