const symbolPatterns = {
  javascript: [
    /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    /^(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/gm,
    /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/gm
  ],
  python: [
    /^(?:async\s+)?def\s+([A-Za-z_]\w*)/gm,
    /^class\s+([A-Za-z_]\w*)/gm
  ]
};

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

export function extractSymbols(file) {
  const patterns = symbolPatterns[file.language] ?? [];
  const symbols = [];
  for (const pattern of patterns) {
    for (const match of file.content.matchAll(pattern)) {
      symbols.push({
        id: `${file.path}#${match[1]}`,
        name: match[1],
        kind: pattern.source.includes("class") ? "class" : "function",
        file: file.path,
        line: lineNumber(file.content, match.index ?? 0),
        evidence: `${file.path}:${lineNumber(file.content, match.index ?? 0)}`
      });
    }
  }
  return symbols.sort((left, right) => left.id.localeCompare(right.id));
}

export function buildCodeGraph(scan) {
  const files = scan.files.map((file) => ({
    id: file.path,
    type: "file",
    language: file.language,
    hash: file.hash
  }));
  const symbols = scan.files.flatMap(extractSymbols).map((symbol) => ({
    ...symbol,
    type: "symbol"
  }));
  const edges = symbols.map((symbol) => ({
    from: symbol.file,
    to: symbol.id,
    type: "defines",
    evidence: [symbol.evidence]
  }));

  return {
    revision: scan.revision,
    nodes: [...files, ...symbols],
    edges
  };
}
