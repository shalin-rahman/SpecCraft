import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultParserRegistry } from "../src/parser-adapter.js";

test("parses JavaScript and TypeScript into conservative normalized observations", () => {
  const registry = createDefaultParserRegistry();
  const javascript = registry.parse({
    path: "src/membership.js",
    language: "javascript",
    content: [
      'import { Router } from "./router.js";',
      "export class Member { close() {} }",
      "export function closeMembership() { return true; }",
      'router.get("/members", closeMembership);',
      'test("closes a member", () => {});'
    ].join("\n")
  });

  assert.deepEqual(javascript.symbols.map(({ name, kind }) => [name, kind]), [
    ["Member", "class"],
    ["Member.close", "method"],
    ["closeMembership", "function"]
  ]);
  assert.deepEqual(javascript.imports.map(({ source }) => source), ["./router.js"]);
  assert.equal(javascript.symbols.find(({ name }) => name === "closeMembership").exported, true);
  assert.equal(javascript.routes[0].method, "GET");
  assert.equal(javascript.routes[0].path, "/members");
  assert.equal(javascript.tests[0].name, "closes a member");
  assert.deepEqual(javascript.diagnostics, []);

  const typescript = registry.parse({
    path: "src/membership.ts",
    language: "typescript",
    content: "export function closeMembership(member: Member): boolean { return true; }"
  });
  assert.equal(typescript.symbols[0].name, "closeMembership");
  assert.deepEqual(typescript.diagnostics, []);
});

test("labels lexical Python extraction and unsupported languages explicitly", () => {
  const registry = createDefaultParserRegistry();
  const python = registry.parse({
    path: "service.py",
    language: "python",
    content: "class Member:\n    def close_membership(self):\n        pass\n"
  });
  assert.deepEqual(python.symbols.map(({ name }) => name), ["Member", "close_membership"]);
  assert.equal(python.diagnostics[0].code, "LEXICAL_PYTHON_EXTRACTION");

  const unsupported = registry.parse({ language: "rust" });
  assert.equal(unsupported.diagnostics[0].code, "UNSUPPORTED_LANGUAGE");
  assert.equal(unsupported.symbols.length, 0);
});
