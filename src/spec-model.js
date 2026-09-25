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

function collectLinkedArtifacts(traceLinks, startId) {
  const adjacency = new Map();
  const allLinks = Array.isArray(traceLinks) ? traceLinks : [];

  for (const link of allLinks) {
    const from = link.from;
    const to = link.to;
    if (!from || !to) continue;

    const left = adjacency.get(from) ?? [];
    left.push(link);
    adjacency.set(from, left);

    const right = adjacency.get(to) ?? [];
    right.push(link);
    adjacency.set(to, right);
  }

  const queue = [{ id: startId, path: [startId] }];
  const seen = new Set([startId]);
  const artifacts = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    const links = adjacency.get(current.id) ?? [];

    for (const link of links) {
      const nextId = link.from === current.id ? link.to : link.from;
      if (nextId === current.id || seen.has(nextId)) continue;

      const path = [...current.path, nextId];
      seen.add(nextId);
      const detail = {
        id: nextId,
        relationship: link.type,
        path,
        evidence: Array.isArray(link.evidence) ? [...link.evidence] : [],
        confidence: link.confidence ?? "medium"
      };
      artifacts.set(nextId, detail);
      queue.push({ id: nextId, path });
    }
  }

  return [...artifacts.values()];
}

export function compileContext(project, requirementId) {
  const requirement = project.requirements.find((item) => item.id === requirementId);
  if (!requirement) {
    throw new Error(`Requirement not found: ${requirementId}`);
  }

  const relatedLinks = project.traceLinks?.filter(
    (item) => item.from === requirementId || item.to === requirementId
  ) ?? [];

  const contextPackage = {
    task: requirement.title,
    requirements: project.requirements.filter((item) => item.id === requirementId),
    constraints: project.rules?.filter((item) => item.requirementId === requirementId) ?? [],
    workflows: project.workflows?.filter((item) => item.requirementId === requirementId) ?? [],
    apiContracts: relatedLinks.filter((item) => item.type === "implements" || item.type === "exposes"),
    relevantCode: relatedLinks.filter((item) => item.type === "implemented-in" || item.type === "implemented-by"),
    tests: relatedLinks.filter((item) => item.type === "verified-by" || item.type === "tests"),
    decisions: [],
    findings: analyzeRequirement(requirement),
    evidence: [...new Set(relatedLinks.flatMap((item) => item.evidence ?? []))],
    provenance: relatedLinks.map((item) => ({
      relation: item.type,
      from: item.from,
      to: item.to,
      evidence: item.evidence ?? []
    })),
    contextRevision: `${requirementId}:${project.version ?? "0.1.0"}`
  };

  return {
    requirement,
    rules: project.rules?.filter((item) => item.requirementId === requirementId) ?? [],
    workflows: project.workflows?.filter((item) => item.requirementId === requirementId) ?? [],
    links: relatedLinks,
    findings: analyzeRequirement(requirement),
    contextPackage,
    relatedArtifacts: relatedLinks.map((item) => ({
      id: item.to,
      relationship: item.type,
      evidence: item.evidence ?? []
    }))
  };
}

export function calculateImpact(project, changedId) {
  const directLinks = project.traceLinks?.filter(
    (item) => item.from === changedId || item.to === changedId
  ) ?? [];
  const artifacts = collectLinkedArtifacts(project.traceLinks ?? [], changedId);
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
