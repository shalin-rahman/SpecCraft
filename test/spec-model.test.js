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
  });

  assert.deepEqual(summarizeProject(project), {
    total: 2,
    approved: 1,
    withEvidence: 1,
    highPriority: 1
  });
});
