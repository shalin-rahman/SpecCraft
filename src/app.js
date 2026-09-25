import {
  analyzeRequirement,
  calculateImpact,
  compileContext,
  createRequirement,
  createSpecProject,
  summarizeProject
} from "./spec-model.js";

const demoProject = createSpecProject({
  name: "SpecCraft",
  requirements: [
    {
      id: "REQ-001",
      title: "Keep project knowledge versioned",
      description: "Requirements, decisions, and evidence live with the code.",
      priority: "high",
      status: "approved",
      evidence: ["docs/requirment-spec-of-SpecCraft.md"]
    },
    {
      id: "REQ-002",
      title: "Expose focused context",
      description: "Tools receive the relevant project context for the current task.",
      priority: "medium",
      status: "proposed"
    }
  ],
  rules: [
    {
      id: "BR-001",
      requirementId: "REQ-001",
      title: "Keep approved knowledge in Git"
    }
  ],
  workflows: [
    {
      id: "WF-001",
      requirementId: "REQ-001",
      title: "Review and approve a requirement"
    }
  ],
  traceLinks: [
    { from: "REQ-001", to: "BR-001", type: "governed-by", evidence: ["README.md"] },
    { from: "REQ-001", to: "WF-001", type: "implemented-by", evidence: ["docs/requirment-spec-of-SpecCraft.md"] },
    { from: "REQ-001", to: "src/spec-model.js", type: "implemented-in", evidence: ["src/spec-model.js"] },
    { from: "REQ-001", to: "test/spec-model.test.js", type: "verified-by", evidence: ["test/spec-model.test.js"] }
  ]
});

function renderProjectSummary() {
  const target = document.querySelector("[data-project-summary]");
  if (!target) return;

  const summary = summarizeProject(demoProject);
  target.textContent = `${summary.total} requirements · ${summary.approved} approved · ${summary.withEvidence} with evidence`;
}

function renderMvpDemo() {
  let requirement = demoProject.requirements[0];
  const findingsTarget = document.querySelector("[data-findings]");
  const impactTarget = document.querySelector("[data-impact]");
  const contextTarget = document.querySelector("[data-context]");
  const idTarget = document.querySelector("[data-requirement-id]");
  const statusTarget = document.querySelector("[data-requirement-status]");

  const render = () => {
    const findings = analyzeRequirement(requirement);
    const activeProject = requirement.id === demoProject.requirements[0].id
      ? demoProject
      : createSpecProject({ name: demoProject.name, requirements: [requirement] });

    if (findingsTarget) {
      findingsTarget.innerHTML = findings.length
        ? findings.map((finding) => `<li><strong>${finding.type}</strong> — ${finding.message}</li>`).join("")
        : "<li>No review findings.</li>";
    }

    if (impactTarget) {
      impactTarget.textContent = calculateImpact(activeProject, requirement.id).message;
    }

    if (contextTarget) {
      const context = compileContext(activeProject, requirement.id);
      contextTarget.textContent = [...new Set([
        context.requirement.id,
        ...context.rules.map((item) => item.id),
        ...context.workflows.map((item) => item.id),
        ...context.links.map((item) => item.to)
      ])].join(" · ");
    }

    if (idTarget) idTarget.textContent = requirement.id;
    if (statusTarget) statusTarget.textContent = findings.length ? "Needs review" : "Ready to approve";
  };

  render();

  document.querySelector("[data-requirement-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    requirement = createRequirement({
      id: "REQ-NEW",
      title: form.get("title"),
      description: form.get("description"),
      priority: "high",
      status: "draft"
    });
    render();
  });
}

document.addEventListener("DOMContentLoaded", renderProjectSummary);
document.addEventListener("DOMContentLoaded", renderMvpDemo);
