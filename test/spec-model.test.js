import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeRequirement,
  calculateImpact,
  compileContext,
  createRequirement,
  createSpecProject,
  summarizeProject
} from "../src/spec-model.js";

test("creates a normalized requirement with safe defaults", () => {
  const requirement = createRequirement({
    id: " REQ-001 ",
    title: "Version the project knowledge",
    description: "Keep the requirement in the repository."
  });

  assert.equal(requirement.id, "REQ-001");
  assert.equal(requirement.priority, "medium");
  assert.equal(requirement.status, "draft");
  assert.deepEqual(requirement.evidence, []);
});

test("rejects missing requirement fields and invalid enums", () => {
  assert.throws(
    () => createRequirement({ id: "REQ-001", title: "", description: "x" }),
    /title must be a non-empty string/
  );
  assert.throws(
    () =>
      createRequirement({
        id: "REQ-001",
        title: "A",
        description: "B",
        priority: "urgent"
      }),
    /Unsupported priority/
  );
});

test("finds ambiguous and incomplete requirement language", () => {
  const findings = analyzeRequirement(
    createRequirement({
      id: "REQ-003",
      title: "Close the account quickly",
      description: "The system should close it normally."
    })
  );

  assert.equal(findings.some((item) => item.type === "ambiguity"), true);
  assert.equal(findings.some((item) => item.type === "incompleteness"), true);
});

test("compiles context and reports connected impact", () => {
  const project = createSpecProject({
    name: "Example",
    requirements: [
      { id: "REQ-001", title: "A", description: "A requirement", status: "approved" }
    ],
    rules: [{ id: "BR-001", requirementId: "REQ-001" }],
    workflows: [{ id: "WF-001", requirementId: "REQ-001" }],
    traceLinks: [
      { from: "REQ-001", to: "BR-001", type: "governed-by" },
      { from: "REQ-001", to: "test/a.js", type: "verified-by" }
    ]
  });

  const context = compileContext(project, "REQ-001");
  const impact = calculateImpact(project, "REQ-001");

  assert.equal(context.rules[0].id, "BR-001");
  assert.deepEqual(impact.affected, ["BR-001", "test/a.js"]);
  assert.equal(context.contextPackage.task, "A");
  assert.equal(context.contextPackage.requirements[0].id, "REQ-001");
});

test("preserves project collections and normalizes trace links through the graph contract", () => {
  const project = createSpecProject({
    name: "Records",
    requirements: [{ id: "REQ-1", title: "A", description: "A requirement" }],
    apiContracts: [{ id: "API-1", requirementId: "REQ-1" }],
    permissions: [{ id: "PERM-1", requirementId: "REQ-1" }],
    decisions: [{ id: "DEC-1", requirementId: "REQ-1" }],
    traceLinks: [
      { from: "REQ-1", to: "API-1", type: "exposes" },
      { from: "REQ-1", to: "PERM-1", type: "authorized-by", freshness: "stale", reviewState: "stale" },
      { from: "REQ-1", to: "DEC-1", type: "derived-from", confidence: "high", evidence: ["decision.md#1"] },
      { from: "REQ-1", to: "src/inferred.ts", type: "implemented-in" }
    ]
  });

  assert.equal(project.apiContracts[0].id, "API-1");
  assert.equal(project.permissions[0].id, "PERM-1");
  assert.equal(project.decisions[0].id, "DEC-1");
  const impact = calculateImpact(project, "REQ-1");
  assert.equal(impact.artifacts.find((item) => item.id === "API-1").freshness, "current");
  assert.equal(impact.artifacts.find((item) => item.id === "PERM-1").freshness, "stale");
  assert.deepEqual(impact.artifacts.find((item) => item.id === "DEC-1").evidence, ["decision.md#1"]);
  assert.equal(impact.artifacts.find((item) => item.id === "src/inferred.ts").node.type, "file");
});

test("rejects unsupported and duplicate project trace relationships", () => {
  assert.throws(() => calculateImpact(createSpecProject({
    name: "Missing start",
    traceLinks: [{ from: "REQ-1", to: "CODE-1", type: "implements" }]
  }), "UNKNOWN"), /Knowledge node not found/);
  const unsupported = createSpecProject({
    name: "Unsupported relationship",
    requirements: [{ id: "REQ-1", title: "A", description: "A requirement" }],
    traceLinks: [{ from: "REQ-1", to: "CODE-1", type: "made-up" }]
  });
  assert.throws(() => calculateImpact(unsupported, "REQ-1"), /Unsupported knowledge relationship type/);

  const project = createSpecProject({
    name: "Duplicate",
    requirements: [{ id: "REQ-1", title: "A", description: "A requirement" }],
    traceLinks: [
      { from: "REQ-1", to: "CODE-1", type: "implements" },
      { from: "REQ-1", to: "CODE-1", type: "implements" }
    ]
  });
  assert.throws(() => calculateImpact(project, "REQ-1"), /Duplicate knowledge edge/);
});

test("calculates transitive impact across multiple graph hops", () => {
  const project = createSpecProject({
    name: "Example",
    requirements: [{ id: "REQ-001", title: "A", description: "A requirement", status: "approved" }],
    rules: [{ id: "BR-001", requirementId: "REQ-001" }],
    workflows: [{ id: "WF-001", requirementId: "REQ-001" }],
    traceLinks: [
      { from: "REQ-001", to: "BR-001", type: "governed-by" },
      { from: "BR-001", to: "WF-001", type: "implemented-by" },
      { from: "WF-001", to: "src/service.js", type: "implemented-in" },
      { from: "src/service.js", to: "test/service.test.js", type: "verified-by" }
    ]
  });

  const impact = calculateImpact(project, "REQ-001");

  assert.deepEqual(impact.affected.sort(), ["BR-001", "WF-001", "src/service.js", "test/service.test.js"].sort());
  assert.equal(impact.artifacts.length >= 3, true);
});

test("summarizes project status and evidence", () => {
  const project = createSpecProject({
    name: "Example",
    requirements: [
      {
        id: "REQ-001",
        title: "A",
        description: "B",
        priority: "critical",
        status: "approved",
        evidence: ["test/a.js"]
      },
      {
        id: "REQ-002",
        title: "C",
        description: "D",
        priority: "low",
        status: "draft"
      }
    ]
  });

  assert.deepEqual(summarizeProject(project), {
    total: 2,
    approved: 1,
    withEvidence: 1,
    highPriority: 1
  });
});
