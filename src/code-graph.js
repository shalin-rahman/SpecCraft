import { createDefaultParserRegistry } from "./parser-adapter.js";

function isTestFile(path) {
  return /(^|[\\/])tests?([\\/]|$)|(?:\.test|\.spec)\.[^.]+$|(?:^|_)test\.py$/i.test(path);
}

function moduleNodeId(source) {
  return `module:${source}`;
}

export function extractSymbols(file, parserRegistry = createDefaultParserRegistry()) {
  return parserRegistry.parse(file).symbols;
}

export function buildCodeGraph(scan, { parserRegistry = createDefaultParserRegistry() } = {}) {
  const files = scan.files.map((file) => ({
    id: file.path,
    type: "file",
    language: file.language,
    hash: file.hash,
    isTestFile: isTestFile(file.path)
  }));
  const nodes = new Map(files.map((file) => [file.id, file]));
  const edges = [];
  const diagnostics = [];
  const parsedFiles = new Map();

  for (const file of scan.files) {
    const parsed = parserRegistry.parse(file);
    parsedFiles.set(file.path, parsed);
    diagnostics.push(...parsed.diagnostics);

    // Keep the established public node type while preserving richer parser
    // classification in `kind` for consumers that need it.
    const fileSymbols = parsed.symbols.map((symbol) => ({ ...symbol, type: "symbol" }));
    for (const symbol of fileSymbols) {
      nodes.set(symbol.id, symbol);
      edges.push({
        from: symbol.file,
        to: symbol.id,
        type: "defines",
        evidence: [symbol.evidence],
        confidence: "high"
      });
    }
    for (const imported of parsed.imports) {
      const id = moduleNodeId(imported.source);
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          type: "module",
          source: imported.source,
          external: true
        });
      }
      edges.push({
        from: file.path,
        to: id,
        type: "imports",
        evidence: [`${file.path}:${imported.line}`],
        confidence: "medium"
      });
    }
    for (const route of parsed.routes) {
      const api = { ...route, type: "api" };
      nodes.set(api.id, api);
      edges.push({
        from: file.path,
        to: api.id,
        type: "exposes",
        evidence: [route.evidence],
        confidence: "medium"
      });
    }
    for (const test of parsed.tests) {
      const testNode = { ...test, type: "test" };
      nodes.set(testNode.id, testNode);
      edges.push({
        from: file.path,
        to: testNode.id,
        type: "defines",
        evidence: [test.evidence],
        confidence: "high"
      });
    }
    if (isTestFile(file.path)) {
      for (const imported of parsed.imports) {
        edges.push({
          from: file.path,
          to: moduleNodeId(imported.source),
          type: "tests",
          evidence: [`${file.path}:${imported.line}`],
          confidence: "low"
        });
      }
    }
  }

  for (const [filePath, parsed] of parsedFiles) {
    const symbolsByName = new Map();
    for (const symbol of parsed.symbols) {
      if (!symbolsByName.has(symbol.name)) symbolsByName.set(symbol.name, symbol);
    }
    for (const call of parsed.calls) {
      const caller = symbolsByName.get(call.caller);
      const callee = symbolsByName.get(call.callee);
      if (!caller || !callee) continue;
      edges.push({
        from: caller.id,
        to: callee.id,
        type: "calls",
        evidence: [`${filePath}:${call.line}`],
        confidence: "low"
      });
    }
  }

  return {
    revision: scan.revision,
    nodes: [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id)),
    edges: edges.sort((left, right) =>
      left.from.localeCompare(right.from) ||
      left.type.localeCompare(right.type) ||
      left.to.localeCompare(right.to)
    ),
    diagnostics
  };
}
