import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanRepository } from "../src/repository-platform.js";

test("scans a stable lexical subset before enforcing the file cap", async () => {
  const root = await mkdtemp(join(tmpdir(), "speccraft-scan-"));
  try {
    for (let index = 0; index < 2001; index += 1) {
      const name = `file-${String(index).padStart(4, "0")}.js`;
      await writeFile(join(root, name), `export const value = ${JSON.stringify(name)};`);
    }
    const first = await scanRepository(root);
    const second = await scanRepository(root);
    assert.equal(first.files.length, 2000);
    assert.equal(first.files[0].path, "file-0000.js");
    assert.equal(first.files.at(-1).path, "file-1999.js");
    assert.deepEqual(second.files.map((file) => file.path), first.files.map((file) => file.path));
    assert.equal(second.revision, first.revision);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
