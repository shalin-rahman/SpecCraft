import { dirname, extname, join, normalize } from "node:path";
import { createDefaultParserRegistry } from "./parser-adapter.js";

function isTestFile(path) {
  return /(^|[\\/])tests?([\\/]|$)|(?:\.test|\.spec)\.[^.]+$|(?:^|_)test\.py$/i.test(path);
}

function moduleNodeId(source, importerPath) {
  return source.startsWith(".") ? `module:${importerPath}:${source}` : `module:${source}`;
}

const sourceExtensions = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"];

function resolveScannedImport(importerPath, source, filesByPath) {
  if (!source.startsWith(".")) return null;
  const base = normalize(join(dirname(importerPath), source)).replaceAll("\\", "/");
  const candidates = [base];
  if (!extname(base)) {
    for (const extension of sourceExtensions) candidates.push(`${base}${extension}`);
    for (const extension of sourceExtensions) candidates.push(`${base}/index${extension}`);
  }
  return candidates.find((candidate) => filesByPath.has(candidate)) ?? null;
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
  const filesByPath = new Map(scan.files.map((file) => [file.path.replaceAll("\\", "/"), file]));
  const importEdges = new Map();
  const addImportEdge = (from, to, evidence) => {
    const key = `${from}\u0000${to}`;
    const existing = importEdges.get(key);
    if (existing) {
      if (!existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      return;
    }
    importEdges.set(key, { from, to, type: "imports", evidence: [evidence], confidence: "medium" });
  };

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
      const importerPath = file.path.replaceAll("\\", "/");
      const id = moduleNodeId(imported.source, importerPath);
      const resolvedFile = resolveScannedImport(importerPath, imported.source, filesByPath);
      const existingModule = nodes.get(id);
      if (!existingModule) {
        nodes.set(id, {
          id,
          type: "module",
          source: imported.source,
          external: resolvedFile === null,
          ...(resolvedFile ? { resolvedFile } : {})
        });
      } else if (resolvedFile && !existingModule.resolvedFile && existingModule.external) {
        existingModule.external = false;
        existingModule.resolvedFile = resolvedFile;
      } else if (resolvedFile && existingModule.resolvedFile && existingModule.resolvedFile !== resolvedFile) {
        existingModule.external = true;
        delete existingModule.resolvedFile;
        diagnostics.push({
          severity: "warning",
          code: "AMBIGUOUS_RELATIVE_IMPORT",
          message: `Relative import ${imported.source} resolves to different scanned files; module target is left unresolved.`,
          file: file.path
        });
      }
      const evidence = `${file.path}:${imported.line}`;
      addImportEdge(file.path, id, evidence);
      if (resolvedFile) addImportEdge(file.path, resolvedFile, evidence);
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
          to: moduleNodeId(imported.source, file.path.replaceAll("\\", "/")),
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

  edges.push(...importEdges.values());

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
