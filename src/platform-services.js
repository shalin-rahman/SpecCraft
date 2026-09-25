import { buildCodeGraph } from "./code-graph.js";
import { scanRepository } from "./repository-platform.js";

export async function analyzeRepository(root) {
  const scan = await scanRepository(root);
  const graph = buildCodeGraph(scan);
  return {
    scan: {
      root: scan.root,
      revision: scan.revision,
      files: scan.files.map(({ content, ...file }) => file)
    },
    graph
  };
}

export function reconstructCandidates(analysis) {
  return analysis.graph.nodes
    .filter((node) => node.type === "symbol")
    .map((symbol) => ({
      id: `CAND-${symbol.id}`,
      title: `Document ${symbol.name}`,
      description: `Candidate knowledge inferred from ${symbol.evidence}.`,
      source: symbol.evidence,
      confidence: "low",
      reviewState: "candidate"
    }));
}

export function detectDrift(previous, current) {
  const oldFiles = new Map((previous?.scan?.files ?? []).map((file) => [file.path, file]));
  const newFiles = new Map((current?.scan?.files ?? []).map((file) => [file.path, file]));
  const added = [...newFiles.keys()].filter((path) => !oldFiles.has(path));
  const removed = [...oldFiles.keys()].filter((path) => !newFiles.has(path));
  const changed = [...newFiles.keys()].filter(
    (path) => oldFiles.has(path) && oldFiles.get(path).hash !== newFiles.get(path).hash
  );
  return { added, removed, changed, drifted: added.length + removed.length + changed.length > 0 };
}

export function compileRepositoryContext(analysis, query) {
  const normalized = String(query ?? "").toLowerCase();
  const nodes = analysis.graph.nodes.filter((node) =>
    node.id.toLowerCase().includes(normalized) || node.name?.toLowerCase().includes(normalized)
  );
  return {
    query: normalized,
    revision: analysis.scan.revision,
    nodes,
    edges: analysis.graph.edges.filter((edge) =>
      nodes.some((node) => node.id === edge.from || node.id === edge.to)
    )
  };
}
