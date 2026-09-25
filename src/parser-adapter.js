import { parse as parseJavaScript } from "@babel/parser";

const commonResult = () => ({
  symbols: [],
  imports: [],
  exports: [],
  tests: [],
  calls: [],
  routes: [],
  diagnostics: []
});

function identifierName(node) {
  if (!node) return null;
  if (node.type === "Identifier" || node.type === "PrivateName") return node.name ?? node.id?.name ?? null;
  if (node.type === "StringLiteral" || node.type === "NumericLiteral") return String(node.value);
  if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") {
    const object = identifierName(node.object);
    const property = node.computed ? identifierName(node.property) : node.property?.name;
    return object && property ? `${object}.${property}` : null;
  }
  return null;
}

function declarationNames(node) {
  if (!node) return [];
  if (node.type === "FunctionDeclaration" && node.id) return [node.id.name];
  if (node.type === "ClassDeclaration" && node.id) return [node.id.name];
  if (node.type === "VariableDeclaration") return node.declarations.map((item) => item.id?.name).filter(Boolean);
  return [];
}

function parseJavaScriptSource(file, language) {
  const result = commonResult();
  const plugins = language === "typescript" ? ["typescript", "jsx"] : ["jsx"];
  let ast;
  try {
    ast = parseJavaScript(file.content, {
      sourceType: "unambiguous",
      sourceFilename: file.path,
      plugins
    });
  } catch (error) {
    result.diagnostics.push({
      severity: "error",
      code: "PARSE_ERROR",
      message: error instanceof Error ? error.message : "Unable to parse source",
      file: file.path
    });
    return result;
  }

  const symbolNames = new Map();
  const addSymbol = (name, kind, node) => {
    if (!name) return;
    const line = node.loc?.start.line ?? 1;
    const ordinal = symbolNames.get(name) ?? 0;
    symbolNames.set(name, ordinal + 1);
    result.symbols.push({
      id: `${file.path}#${name}${ordinal ? `@${line}` : ""}`,
      name,
      kind,
      file: file.path,
      line,
      evidence: `${file.path}:${line}`
    });
  };

  const visit = (node, enclosingSymbol = null, enclosingClass = null, parent = null) => {
    if (!node || typeof node !== "object") return;
    let currentSymbol = enclosingSymbol;
    let currentClass = enclosingClass;

    if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
      currentClass = node.id?.name ?? enclosingClass;
      addSymbol(currentClass, "class", node);
    } else if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression" ||
               node.type === "ArrowFunctionExpression") {
      const variableName = parent?.type === "VariableDeclarator" ? parent.id?.name : null;
      const methodName = ["ClassMethod", "ClassPrivateMethod", "ObjectMethod"].includes(parent?.type)
        ? identifierName(parent.key)
        : null;
      const name = node.id?.name ?? variableName ?? methodName;
      if (name) {
        const qualifiedName = currentClass && methodName ? `${currentClass}.${name}` : name;
        if (!methodName) addSymbol(qualifiedName, "function", parent ?? node);
        currentSymbol = qualifiedName;
      }
    } else if (["ClassMethod", "ClassPrivateMethod", "ObjectMethod"].includes(node.type)) {
      const method = identifierName(node.key);
      if (method) {
        const qualifiedName = currentClass ? `${currentClass}.${method}` : method;
        addSymbol(qualifiedName, currentClass ? "method" : "function", node);
        currentSymbol = qualifiedName;
      }
    }

    if (node.type === "ImportDeclaration") {
      result.imports.push({
        source: node.source.value,
        line: node.loc?.start.line ?? 1,
        specifiers: node.specifiers.map((specifier) => ({
          local: specifier.local.name,
          imported: specifier.imported?.name ?? (specifier.type === "ImportDefaultSpecifier" ? "default" : "*")
        }))
      });
    }
    if (node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration") {
      result.exports.push({
        names: declarationNames(node.declaration).length
          ? declarationNames(node.declaration)
          : node.declaration?.id?.name
            ? [node.declaration.id.name]
          : (node.specifiers ?? []).map((specifier) => specifier.exported?.name).filter(Boolean),
        line: node.loc?.start.line ?? 1,
        default: node.type === "ExportDefaultDeclaration"
      });
    }
    if (node.type === "CallExpression" || node.type === "OptionalCallExpression") {
      const callee = identifierName(node.callee);
      const args = node.arguments ?? [];
      if (currentSymbol && callee) {
        result.calls.push({ caller: currentSymbol, callee, line: node.loc?.start.line ?? 1 });
      }
      if (callee === "test" || callee === "it" || callee === "describe") {
        const title = args[0]?.value;
        if (typeof title === "string") {
          result.tests.push({
            id: `${file.path}#test:${title}`,
            name: title,
            file: file.path,
            line: node.loc?.start.line ?? 1,
            evidence: `${file.path}:${node.loc?.start.line ?? 1}`
          });
        }
      }
      const routeMethod = callee?.match(/(?:^|\.)(get|post|put|patch|delete|all)$/i)?.[1]?.toUpperCase();
      const routePath = args[0]?.type === "StringLiteral" ? args[0].value : null;
      if (routeMethod && typeof routePath === "string" && routePath.startsWith("/")) {
        result.routes.push({
          id: `${file.path}#${routeMethod} ${routePath}`,
          method: routeMethod,
          path: routePath,
          file: file.path,
          line: node.loc?.start.line ?? 1,
          evidence: `${file.path}:${node.loc?.start.line ?? 1}`
        });
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "loc" || key === "start" || key === "end" || key === "tokens" || key === "comments") continue;
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object" && typeof child.type === "string") {
            visit(child, currentSymbol, currentClass, node);
          }
        }
      } else if (value && typeof value === "object" && typeof value.type === "string") {
        visit(value, currentSymbol, currentClass, node);
      }
    }
  };

  visit(ast.program);
  const exportedNames = new Set(result.exports.flatMap((item) => item.names));
  for (const symbol of result.symbols) symbol.exported = exportedNames.has(symbol.name);
  return result;
}

function parsePythonSource(file) {
  const result = commonResult();
  const classScopes = [];
  for (const [index, sourceLine] of file.content.split(/\r?\n/).entries()) {
    const match = sourceLine.match(/^(\s*)(?:(?:async\s+)?def\s+([A-Za-z_]\w*)|class\s+([A-Za-z_]\w*))/);
    if (!match) continue;
    const indentation = match[1].replace(/\t/g, "    ").length;
    while (classScopes.length && classScopes.at(-1).indentation >= indentation) classScopes.pop();

    const isClass = Boolean(match[3]);
    const name = match[2] ?? match[3];
    const kind = isClass ? "class" : classScopes.length ? "method" : "function";
    const line = index + 1;
    result.symbols.push({
      id: `${file.path}#${name}`,
      name,
      kind,
      file: file.path,
      line,
      evidence: `${file.path}:${line}`
    });
    if (isClass) classScopes.push({ name, indentation });
  }
  for (const match of file.content.matchAll(/^(?:from\s+([.\w]+)\s+import|import\s+([.\w]+))/gm)) {
    const line = file.content.slice(0, match.index).split("\n").length;
    result.imports.push({ source: match[1] ?? match[2], line, specifiers: [] });
  }
  const isTestFile = /(^|[\\/])test[^\\/]*\.py$|(?:^|_)test\.py$/i.test(file.path);
  if (isTestFile) {
    for (const symbol of result.symbols.filter((item) => item.name.startsWith("test_"))) {
      result.tests.push({ ...symbol, id: `${symbol.id}:test`, evidence: symbol.evidence });
    }
  }
  result.diagnostics.push({
    severity: "info",
    code: "LEXICAL_PYTHON_EXTRACTION",
    message: "Python extraction is conservative and lexical; it does not resolve scopes or infer semantics.",
    file: file.path
  });
  return result;
}

export class ParserRegistry {
  constructor(parsers = new Map()) {
    this.parsers = new Map(parsers);
  }

  register(language, parser) {
    if (typeof language !== "string" || !language.trim()) throw new TypeError("Parser language is required");
    if (!parser || typeof parser.parse !== "function") throw new TypeError("Parser must expose parse(file)");
    this.parsers.set(language.toLowerCase(), parser);
  }

  parse(file) {
    if (!file || typeof file !== "object") throw new TypeError("Parser input must be an object");
    const language = String(file.language ?? "").toLowerCase();
    const parser = this.parsers.get(language);
    if (!parser) {
      return {
        ...commonResult(),
        diagnostics: [{
          severity: "warning",
          code: "UNSUPPORTED_LANGUAGE",
          message: `No parser registered for ${language || "unknown"}`,
          file: file.path
        }]
      };
    }
    if (typeof file.content !== "string") {
      throw new TypeError("Parser input must include source content");
    }
    return parser.parse(file);
  }
}

export function createDefaultParserRegistry() {
  const registry = new ParserRegistry();
  registry.register("javascript", { parse: (file) => parseJavaScriptSource(file, "javascript") });
  registry.register("typescript", { parse: (file) => parseJavaScriptSource(file, "typescript") });
  registry.register("python", { parse: parsePythonSource });
  return registry;
}
