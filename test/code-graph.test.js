import test from "node:test";
import assert from "node:assert/strict";
import { buildCodeGraph } from "../src/code-graph.js";
import { createKnowledgeGraph, traverseKnowledgeGraph } from "../src/knowledge-graph.js";

test("resolves relative imports only to scanned JavaScript and TypeScript files", () => {
  const graph = buildCodeGraph({
    revision: "fixture",
    files: [
      { path: "src/main.js", language: "javascript", hash: "a", content: 'import "./exact.js"; import "./folder"; import "./missing"; import "pkg";' },
      { path: "src/exact.js", language: "javascript", hash: "b", content: "export const exact = true;" },
      { path: "src/folder/index.ts", language: "typescript", hash: "c", content: "export const index = true;" }
    ]
  });
  const modules = graph.nodes.filter((node) => node.type === "module");
  assert.deepEqual(modules.find((node) => node.source === "./exact.js"), {
    id: "module:src/main.js:./exact.js", type: "module", source: "./exact.js", external: false, resolvedFile: "src/exact.js"
  });
  assert.equal(modules.find((node) => node.source === "./folder").resolvedFile, "src/folder/index.ts");
  assert.equal(modules.find((node) => node.source === "./missing").external, true);
  assert.equal(modules.find((node) => node.source === "pkg").external, true);
});

test("keeps same relative specifiers distinct and links importers to local files", () => {
  const graph = buildCodeGraph({
    revision: "nested-fixture",
    files: [
      { path: "src/a/main.js", language: "javascript", hash: "a", content: 'import "./util"; import "./util";' },
      { path: "src/a/util.js", language: "javascript", hash: "b", content: "export const a = true;" },
      { path: "src/b/main.js", language: "javascript", hash: "c", content: 'import "./util";' },
      { path: "src/b/util.js", language: "javascript", hash: "d", content: "export const b = true;" }
    ]
  });
  const moduleNodes = graph.nodes.filter((node) => node.type === "module");
  assert.equal(moduleNodes.find((node) => node.id === "module:src/a/main.js:./util").resolvedFile, "src/a/util.js");
  assert.equal(moduleNodes.find((node) => node.id === "module:src/b/main.js:./util").resolvedFile, "src/b/util.js");
  const directEdges = graph.edges.filter((edge) => edge.type === "imports" && edge.to.endsWith("util.js"));
  assert.deepEqual(directEdges.map(({ from, to }) => [from, to]), [
    ["src/a/main.js", "src/a/util.js"], ["src/b/main.js", "src/b/util.js"]
  ]);
  assert.deepEqual(directEdges[0].evidence, ["src/a/main.js:1"]);
  const normalized = createKnowledgeGraph({ nodes: graph.nodes, edges: graph.edges, revision: graph.revision });
  assert.equal(traverseKnowledgeGraph(normalized, "src/a/main.js", { direction: "outgoing" }).some((item) => item.id === "src/a/util.js"), true);
  assert.equal(traverseKnowledgeGraph(normalized, "src/b/main.js", { direction: "outgoing" }).some((item) => item.id === "src/b/util.js"), true);
});
