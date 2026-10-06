"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const files = [
  "plugin.json",
  ".cursor-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/marketplace.json",
  ".claude-plugin/marketplace.json",
];

function manifest(file, version) {
  return file.endsWith("marketplace.json")
    ? { name: "understudy", plugins: [{ name: "understudy", version }] }
    : { name: "understudy", version, description: "fixture" };
}

function bump(part) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "understudy-bump-"));
  fs.copyFileSync(path.join(root, "Makefile"), path.join(dir, "Makefile"));
  for (const file of files) {
    const dest = path.join(dir, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, `${JSON.stringify(manifest(file, "0.1.0"), null, 2)}\n`);
  }

  const result = spawnSync("make", ["bump-version", `PART=${part}`], { cwd: dir, encoding: "utf8" });
  const versions = files.map((file) => {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    return doc.version ?? doc.plugins[0].version;
  });
  return { status: result.status, versions, output: `${result.stdout}\n${result.stderr}` };
}

for (const [part, version] of [["patch", "0.1.1"], ["minor", "0.2.0"]]) {
  test(`PART=${part} sets every manifest to ${version}`, () => {
    const got = bump(part);
    assert.equal(got.status, 0, got.output);
    assert.deepEqual(got.versions, Array(files.length).fill(version));
  });
}

test("an unknown PART fails and leaves the manifests unchanged", () => {
  const got = bump("nope");
  assert.notEqual(got.status, 0);
  assert.deepEqual(got.versions, Array(files.length).fill("0.1.0"));
});
