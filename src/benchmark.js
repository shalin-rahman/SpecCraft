import { performance } from "node:perf_hooks";
import { analyzeRepository } from "./platform-services.js";

export async function runRepositoryBenchmark(root, scale = "custom") {
  const started = performance.now();
  const analysis = await analyzeRepository(root);
  return {
    scale,
    root,
    files: analysis.scan.files.length,
    nodes: analysis.graph.nodes.length,
    durationMs: Math.round(performance.now() - started)
  };
}

export function evaluateLabels(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const truePositive = [...actualSet].filter((item) => expectedSet.has(item)).length;
  return {
    truePositive,
    falsePositive: actualSet.size - truePositive,
    falseNegative: expectedSet.size - truePositive,
    precision: actualSet.size ? truePositive / actualSet.size : 1,
    recall: expectedSet.size ? truePositive / expectedSet.size : 1
  };
}
