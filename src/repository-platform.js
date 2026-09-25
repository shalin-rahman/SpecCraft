import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", "coverage", ".venv"]);
const ignoredFiles = new Set([".env", ".env.local", ".env.production", "id_rsa", "id_ed25519"]);
const supportedExtensions = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".py"]);
const maxFileBytes = 512_000;
const maxFiles = 2_000;

function ensureRepositoryRoot(root) {
  const resolved = resolve(root);
  if (!resolved || resolved === parsePathRoot(resolved)) {
    throw new Error("A non-root repository path is required");
  }
  return resolved;
}

function parsePathRoot(value) {
  const match = value.match(/^[A-Za-z]:\\|^\\\\[^\\]+\\[^\\]+\\/);
  return match ? match[0] : value;
}

function hash(content) {
  return createHash("sha256").update(content).digest("hex");
}

function languageFor(filePath) {
  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  if (extension === ".py") return "python";
  if ([".ts", ".tsx"].includes(extension)) return "typescript";
  return "javascript";
}

async function walk(root, current, files) {
  if (files.length >= maxFiles) return;
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (files.length >= maxFiles || ignoredDirectories.has(entry.name)) continue;
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(root, absolute, files);
      continue;
    }
    if (!entry.isFile() || ignoredFiles.has(entry.name)) continue;
    const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
    if (!supportedExtensions.has(extension)) continue;
    const metadata = await stat(absolute);
    if (metadata.size > maxFileBytes) continue;
    const content = await readFile(absolute, "utf8");
    files.push({
      path: relative(root, absolute).split(sep).join("/"),
      language: languageFor(entry.name),
      bytes: metadata.size,
      hash: hash(content),
      content
    });
  }
}

export async function scanRepository(root) {
  const repositoryRoot = ensureRepositoryRoot(root);
  const files = [];
  await walk(repositoryRoot, repositoryRoot, files);
  return {
    root: repositoryRoot,
    files,
    revision: hash(files.map((file) => `${file.path}:${file.hash}`).join("\n"))
  };
}

export { hash };
