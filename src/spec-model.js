import { traverseKnowledgeGraph } from "./knowledge-graph.js";

const validStatuses = new Set(["draft", "proposed", "approved", "deprecated"]);
const validPriorities = new Set(["low", "medium", "high", "critical"]);
const ambiguousTerms = /\b(quickly|normally|soon|appropriate|authorized|easy|secure)\b/gi;

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

export function createRequirement(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("A requirement object is required");
  }

  const id = requireText(input.id, "id");
  const title = requireText(input.title, "title");
  const description = requireText(input.description, "description");
  const priority = input.priority ?? "medium";
  const status = input.status ?? "draft";

  if (!validPriorities.has(priority)) {
    throw new RangeError(`Unsupported priority: ${priority}`);
  }
  if (!validStatuses.has(status)) {
    throw new RangeError(`Unsupported status: ${status}`);
  }

  return {
    id,
    title,
    description,
    priority,
    status,
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    links: Array.isArray(input.links) ? [...input.links] : []
  };
}

export function createTraceLink(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("A trace link object is required");
  }

  return {
    from: requireText(input.from, "from"),
    to: requireText(input.to, "to"),
    type: requireText(input.type, "type"),
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    confidence: input.confidence ?? "medium"
  };
}

export function analyzeRequirement(requirement) {
  const findings = [];
  const text = `${requirement.title} ${requirement.description}`;
  const ambiguous = [...new Set(text.match(ambiguousTerms) ?? [])];

  if (ambiguous.length > 0) {
    findings.push({
      type: "ambiguity",
      severity: "medium",
      message: `Clarify these terms: ${ambiguous.join(", ")}.`,
      evidence: ambiguous
    });
  }
  if (!/\b(who|actor|role|user|member|admin|officer)\b/i.test(text)) {
    findings.push({
      type: "incompleteness",
      severity: "medium",
      message: "No responsible actor or role is stated.",
      evidence: []
    });
  }
  if (!/\b(when|if|unless|condition|after|before|must)\b/i.test(text)) {
    findings.push({
      type: "incompleteness",
      severity: "low",
      message: "No condition or timing is stated.",
      evidence: []
    });
  }

  return findings;
}

export function compileContext(project, requirementId) {
  const requirement = project.requirements.find((item) => item.id === requirementId);
  if (!requirement) {
    throw new Error(`Requirement not found: ${requirementId}`);
  }

  const graph = buildProjectTraceGraph(project);
  const traversal = traverseKnowledgeGraph(graph, requirementId);
  const relatedLinks = project.traceLinks?.filter(
    (item) => item.from === requirementId || item.to === requirementId
  ) ?? [];
  const relatedNodes = traversal.map((item) => item.node);
  const rules = project.rules?.filter((item) => item.requirementId === requirementId) ?? [];
  const workflows = project.workflows?.filter((item) => item.requirementId === requirementId) ?? [];
  const apiContracts = relatedNodes.filter((item) => item.type === "api");
  const relevantCode = relatedNodes.filter((item) =>
    ["file", "module", "class", "function", "method", "symbol"].includes(item.type)
  );
  const tests = relatedNodes.filter((item) => item.type === "test");
  const decisions = relatedNodes.filter((item) => item.type === "decision");
  const evidence = [...new Set([
    ...relatedNodes.flatMap((item) => item.evidence ?? []),
    ...traversal.flatMap((item) => item.evidence)
  ])];
  const findings = analyzeRequirement(requirement);
  const unresolvedQuestions = [
    ...(!relevantCode.length ? ["Which code implements this requirement?"] : []),
    ...(!tests.length ? ["Which tests verify this requirement?"] : [])
  ];

  const contextPackage = {
    task: requirement.title,
    requirements: [requirement],
    constraints: rules,
    workflows,
    apiContracts,
    relevantCode,
    tests,
    decisions,
    findings,
    evidence,
    unresolvedQuestions,
    provenance: traversal.map((item) => ({
      path: item.path,
      relationships: item.relationships,
      evidence: item.evidence,
      confidence: item.confidence,
      freshness: item.freshness,
      reviewState: item.reviewState
    })),
    contextRevision: graph.revision
  };

  return {
    requirement,
    rules,
    workflows,
    links: relatedLinks,
    findings,
    contextPackage,
    relatedArtifacts: traversal
  };
}

export function calculateImpact(project, changedId) {
  const directLinks = project.traceLinks?.filter(
    (item) => item.from === changedId || item.to === changedId
  ) ?? [];
  const artifacts = traverseKnowledgeGraph(buildProjectTraceGraph(project), changedId);
  const affected = [...new Set(artifacts.map((item) => item.id))].filter((id) => id !== changedId);

  return {
    changed: changedId,
    affected,
    artifacts,
    links: directLinks,
    message: affected.length > 0
      ? `${affected.length} connected artifact${affected.length === 1 ? "" : "s"} may need review.`
      : "No connected artifacts were found."
  };
}

function buildProjectTraceGraph(project) {
  const nodes = new Map();
  const addNode = (node) => {
    if (typeof node?.id !== "string" || !node.id) return;
    if (!nodes.has(node.id)) nodes.set(node.id, { evidence: [], confidence: "medium", ...node });
  };
  const inferType = (id) => {
    if (/^REQ[-_]/i.test(id)) return "requirement";
    if (/^(BR|RULE)[-_]/i.test(id)) return "rule";
    if (/^WF[-_]/i.test(id)) return "workflow";
    if (/^(API)[-_]/i.test(id)) return "api";
    if (/^(TEST|TST)[-_]/i.test(id) || /(^|\/|\\)test(s)?([/\\.]|$)/i.test(id)) return "test";
    if (/\.(js|mjs|cjs|ts|tsx|py)$/i.test(id)) return "file";
    return "symbol";
  };

  for (const requirement of project.requirements ?? []) {
    addNode({ ...requirement, type: "requirement" });
  }
  for (const [collection, type] of [
    ["rules", "rule"],
    ["workflows", "workflow"],
    ["apiContracts", "api"],
    ["permissions", "permission"],
    ["decisions", "decision"]
  ]) {
    for (const item of project[collection] ?? []) addNode({ ...item, type });
  }
  for (const link of project.traceLinks ?? []) {
    addNode({ id: link.from, type: inferType(link.from), evidence: [] });
    addNode({ id: link.to, type: inferType(link.to), evidence: [] });
  }

  return {
    revision: String(project.version ?? "0.1.0"),
    nodes: [...nodes.values()],
    edges: project.traceLinks ?? []
  };
}

export function createSpecProject(input = {}) {
  const name = requireText(input.name ?? "Untitled project", "name");
  const requirements = Array.isArray(input.requirements)
    ? input.requirements.map(createRequirement)
    : [];

  return {
    name,
    version: input.version ?? "0.1.0",
    requirements,
    rules: Array.isArray(input.rules) ? [...input.rules] : [],
    workflows: Array.isArray(input.workflows) ? [...input.workflows] : [],
    traceLinks: Array.isArray(input.traceLinks)
      ? input.traceLinks.map(createTraceLink)
      : []
  };
}

export function summarizeProject(project) {
  const requirements = project?.requirements ?? [];
  return {
    total: requirements.length,
    approved: requirements.filter((item) => item.status === "approved").length,
    withEvidence: requirements.filter((item) => item.evidence.length > 0).length,
    highPriority: requirements.filter(
      (item) => item.priority === "high" || item.priority === "critical"
    ).length
  };
}
