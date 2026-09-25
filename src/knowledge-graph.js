const nodeTypes = new Set([
  "requirement",
  "rule",
  "workflow",
  "api",
  "permission",
  "decision",
  "file",
  "module",
  "class",
  "function",
  "method",
  "symbol",
  "test",
  "evidence",
  "finding",
  "proposal"
]);

const relationshipTypes = new Set([
  "governed-by",
  "requires",
  "constrained-by",
  "contains",
  "transitions-to",
  "exposes",
  "authorized-by",
  "implements",
  "implemented-by",
  "implemented-in",
  "defined-in",
  "defines",
  "imports",
  "calls",
  "tests",
  "verified-by",
  "derived-from",
  "supported-by",
  "evidence-for",
  "affects",
  "contradicts",
  "supersedes",
  "depends-on",
  "reviewed-by"
]);

const reviewStates = new Set([
  "discovered",
  "candidate",
  "under_review",
  "accepted",
  "rejected",
  "proposed",
  "approved",
  "canonical",
  "verified",
  "stale",
  "conflicted",
  "superseded",
  "deprecated"
]);

const validTransitions = new Map([
  ["discovered", new Set(["candidate"])],
  ["candidate", new Set(["under_review"])],
  ["under_review", new Set(["accepted", "rejected", "candidate", "conflicted"])],
  ["accepted", new Set(["proposed", "under_review"])],
  ["rejected", new Set(["candidate"])],
  ["proposed", new Set(["under_review", "approved", "rejected", "conflicted"])],
  ["approved", new Set(["canonical"])],
  ["canonical", new Set(["verified", "stale", "conflicted", "superseded"])],
  ["verified", new Set(["stale", "conflicted", "superseded"])],
  ["stale", new Set(["candidate"])],
  ["conflicted", new Set(["under_review"])],
  ["superseded", new Set(["deprecated"])],
  ["deprecated", new Set()]
]);

function requireText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function confidenceValue(value) {
  if (value === undefined) return "medium";
  if (["low", "medium", "high"].includes(value)) return value;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) {
    return value;
  }
  throw new RangeError("confidence must be low, medium, high, or a number from 0 to 1");
}

export function createKnowledgeNode(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A knowledge node object is required");
  }
  const id = requireText(input.id, "id");
  const type = requireText(input.type, "type");
  if (!nodeTypes.has(type)) throw new RangeError(`Unsupported knowledge node type: ${type}`);

  const reviewState = input.reviewState ?? "discovered";
  if (!reviewStates.has(reviewState)) {
    throw new RangeError(`Unsupported review state: ${reviewState}`);
  }
  const version = input.version ?? 1;
  if (!Number.isInteger(version) || version < 1) {
    throw new RangeError("version must be a positive integer");
  }

  const node = structuredClone(input);
  return {
    ...node,
    id,
    type,
    version,
    reviewState,
    confidence: confidenceValue(input.confidence),
    source: input.source ?? null,
    provenance: Array.isArray(input.provenance) ? [...input.provenance] : [],
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    reviewHistory: Array.isArray(input.reviewHistory) ? [...input.reviewHistory] : []
  };
}

export function createKnowledgeEdge(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("A knowledge edge object is required");
  }
  const from = requireText(input.from, "from");
  const to = requireText(input.to, "to");
  const type = requireText(input.type, "type");
  if (!relationshipTypes.has(type)) {
    throw new RangeError(`Unsupported knowledge relationship type: ${type}`);
  }

  return {
    ...structuredClone(input),
    from,
    to,
    type,
    confidence: confidenceValue(input.confidence),
    evidence: Array.isArray(input.evidence) ? [...input.evidence] : [],
    freshness: input.freshness ?? "current",
    reviewState: input.reviewState ?? "candidate"
  };
}

export function createKnowledgeGraph({ nodes = [], edges = [], revision = "0" } = {}) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new TypeError("Graph nodes and edges must be arrays");
  }
  const normalizedNodes = nodes.map(createKnowledgeNode);
  const nodesById = new Map();
  for (const node of normalizedNodes) {
    if (nodesById.has(node.id)) throw new Error(`Duplicate knowledge node: ${node.id}`);
    nodesById.set(node.id, node);
  }

  const normalizedEdges = edges.map(createKnowledgeEdge);
  const edgeKeys = new Set();
  for (const edge of normalizedEdges) {
    if (!nodesById.has(edge.from) || !nodesById.has(edge.to)) {
      throw new Error(`Knowledge edge ${edge.from} -${edge.type}-> ${edge.to} has a missing endpoint`);
    }
    const key = `${edge.from}\u0000${edge.type}\u0000${edge.to}`;
    if (edgeKeys.has(key)) throw new Error(`Duplicate knowledge edge: ${edge.from} -${edge.type}-> ${edge.to}`);
    edgeKeys.add(key);
  }

  return {
    revision: String(revision),
    nodes: normalizedNodes.sort((left, right) => left.id.localeCompare(right.id)),
    edges: normalizedEdges.sort((left, right) =>
      left.from.localeCompare(right.from) ||
      left.type.localeCompare(right.type) ||
      left.to.localeCompare(right.to)
    )
  };
}

function confidenceRank(value) {
  if (typeof value === "number") return value;
  return { low: 0.34, medium: 0.67, high: 1 }[value] ?? 0.67;
}

function asConfidence(value) {
  if (value >= 0.84) return "high";
  if (value >= 0.5) return "medium";
  return "low";
}

export function traverseKnowledgeGraph(graph, startId, {
  direction = "both",
  maxDepth = 8,
  maxNodes = 500
} = {}) {
  if (!["both", "outgoing", "incoming"].includes(direction)) {
    throw new RangeError(`Unsupported traversal direction: ${direction}`);
  }
  if (!Number.isInteger(maxDepth) || maxDepth < 0 ||
      !Number.isInteger(maxNodes) || maxNodes < 1) {
    throw new RangeError("maxDepth must be non-negative and maxNodes must be positive integers");
  }

  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  if (!nodesById.has(startId)) throw new Error(`Knowledge node not found: ${startId}`);

  const queue = [{
    id: startId,
    path: [startId],
    relationships: [],
    evidence: [],
    confidence: 1,
    freshness: "current",
    reviewState: nodesById.get(startId).reviewState
  }];
  const seen = new Set([startId]);
  const results = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.path.length - 1 >= maxDepth) continue;

    const adjacent = graph.edges.flatMap((edge) => {
      const matchesOutgoing = edge.from === current.id && direction !== "incoming";
      const matchesIncoming = edge.to === current.id && direction !== "outgoing";
      if (!matchesOutgoing && !matchesIncoming) return [];
      return [{
        edge,
        nextId: matchesOutgoing ? edge.to : edge.from,
        traversal: matchesOutgoing ? "forward" : "reverse"
      }];
    }).sort((left, right) =>
      left.nextId.localeCompare(right.nextId) ||
      left.edge.type.localeCompare(right.edge.type)
    );

    for (const { edge, nextId, traversal } of adjacent) {
      if (seen.has(nextId)) continue;
      if (results.length >= maxNodes) {
        throw new RangeError(`Graph traversal exceeded maxNodes (${maxNodes})`);
      }
      seen.add(nextId);
      const node = nodesById.get(nextId);
      const rank = Math.min(current.confidence, confidenceRank(edge.confidence), confidenceRank(node.confidence));
      const result = {
        id: nextId,
        node,
        path: [...current.path, nextId],
        relationships: [...current.relationships, {
          type: edge.type,
          from: edge.from,
          to: edge.to,
          traversal
        }],
        evidence: [...new Set([...current.evidence, ...edge.evidence, ...node.evidence])],
        confidence: asConfidence(rank),
        freshness: edge.freshness === "current" && node.freshness !== "stale" ? "current" : "stale",
        reviewState: node.reviewState
      };
      results.push(result);
      queue.push({
        id: nextId,
        path: result.path,
        relationships: result.relationships,
        evidence: result.evidence,
        confidence: rank,
        freshness: result.freshness,
        reviewState: result.reviewState
      });
    }
  }

  return results;
}

export function analyzeTraceability(graph) {
  const requirements = graph.nodes.filter((node) => node.type === "requirement");
  const codeTypes = new Set(["file", "module", "class", "function", "method", "symbol"]);
  const results = requirements.map((requirement) => {
    const reachable = traverseKnowledgeGraph(graph, requirement.id);
    const implementation = reachable.find((item) => codeTypes.has(item.node.type));
    const verification = reachable.find((item) => item.node.type === "test");
    return {
      requirementId: requirement.id,
      implemented: Boolean(implementation),
      verified: Boolean(verification),
      implementationPath: implementation?.path ?? [],
      verificationPath: verification?.path ?? [],
      evidence: [...new Set([
        ...(implementation?.evidence ?? []),
        ...(verification?.evidence ?? [])
      ])],
      findings: [
        ...(!implementation ? [{ type: "missing-implementation", severity: "medium" }] : []),
        ...(!verification ? [{ type: "missing-verification", severity: "medium" }] : [])
      ]
    };
  });

  return {
    revision: graph.revision,
    requirements: results,
    unimplemented: results.filter((item) => !item.implemented).map((item) => item.requirementId),
    unverified: results.filter((item) => !item.verified).map((item) => item.requirementId)
  };
}

export function transitionReviewState(nodeInput, nextState, {
  actor,
  actorType = "human",
  reason,
  evidence = [],
  timestamp = new Date().toISOString()
} = {}) {
  const node = createKnowledgeNode(nodeInput);
  if (!reviewStates.has(nextState)) throw new RangeError(`Unsupported review state: ${nextState}`);
  const actorId = requireText(actor, "actor");
  const decisionReason = requireText(reason, "reason");
  if (!["human", "system", "agent"].includes(actorType)) {
    throw new RangeError(`Unsupported actor type: ${actorType}`);
  }
  if (!Array.isArray(evidence)) throw new TypeError("evidence must be an array");
  const parsedTimestamp = new Date(timestamp);
  if (!Number.isFinite(parsedTimestamp.getTime())) throw new TypeError("timestamp must be a valid date");

  if (!validTransitions.get(node.reviewState).has(nextState)) {
    throw new Error(`Invalid review transition: ${node.reviewState} -> ${nextState}`);
  }
  if (["approved", "canonical"].includes(nextState) && actorType !== "human") {
    throw new Error(`${nextState} requires an explicit human decision`);
  }
  if (["approved", "canonical", "verified"].includes(nextState) && evidence.length === 0) {
    throw new Error(`${nextState} requires evidence`);
  }

  const decision = {
    actor: actorId,
    actorType,
    timestamp: parsedTimestamp.toISOString(),
    reason: decisionReason,
    evidence: structuredClone(evidence),
    previousState: node.reviewState,
    nextState
  };

  return {
    ...node,
    reviewState: nextState,
    reviewHistory: [...node.reviewHistory, decision],
    updatedAt: decision.timestamp,
    ...(nextState === "verified" ? { lastVerifiedAt: decision.timestamp } : {})
  };
}

export const KNOWLEDGE_NODE_TYPES = Object.freeze([...nodeTypes]);
export const KNOWLEDGE_RELATIONSHIP_TYPES = Object.freeze([...relationshipTypes]);
export const KNOWLEDGE_REVIEW_STATES = Object.freeze([...reviewStates]);
