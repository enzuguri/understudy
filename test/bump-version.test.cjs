"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.join(__dirname, "..");

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "understudy-bump-"));
  fs.copyFileSync(path.join(repoRoot, "Makefile"), path.join(dir, "Makefile"));
  const plugin = { name: "understudy", version: "0.1.0", description: "fixture" };
  writeJson(path.join(dir, "plugin.json"), plugin);
  writeJson(path.join(dir, ".cursor-plugin/plugin.json"), plugin);
  writeJson(path.join(dir, ".claude-plugin/plugin.json"), plugin);
  const market = { name: "understudy", plugins: [{ name: "understudy", version: "0.1.0" }] };
  writeJson(path.join(dir, ".cursor-plugin/marketplace.json"), market);
  writeJson(path.join(dir, ".claude-plugin/marketplace.json"), market);
  git(dir, ["init", "-q"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "test"]);
  git(dir, ["add", "."]);
  git(dir, ["commit", "-qm", "base"]);
  return dir;
}

function versions(dir) {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  return {
    plugins: ["plugin.json", ".cursor-plugin/plugin.json", ".claude-plugin/plugin.json"].map(
      (file) => read(file).version,
    ),
    markets: [".cursor-plugin/marketplace.json", ".claude-plugin/marketplace.json"].map(
      (file) => read(file).plugins[0].version,
    ),
  };
}

test("bump-version updates every manifest and does not commit", () => {
  const dir = fixture();
  const before = git(dir, ["rev-parse", "HEAD"]);

  const result = spawnSync("make", ["bump-version", "PART=patch"], { cwd: dir, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);

  const found = versions(dir);
  assert.deepEqual(found.plugins, ["0.1.1", "0.1.1", "0.1.1"]);
  assert.deepEqual(found.markets, ["0.1.1", "0.1.1"]);
  assert.equal(git(dir, ["rev-parse", "HEAD"]), before);
});

test("bump-version PART=minor bumps the minor component", () => {
  const dir = fixture();
  const result = spawnSync("make", ["bump-version", "PART=minor"], { cwd: dir, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const found = versions(dir);
  assert.deepEqual(found.plugins, ["0.2.0", "0.2.0", "0.2.0"]);
  assert.deepEqual(found.markets, ["0.2.0", "0.2.0"]);
});

test("bump-version rejects an unknown PART without editing manifests", () => {
  const dir = fixture();
  const result = spawnSync("make", ["bump-version", "PART=nope"], { cwd: dir, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  const found = versions(dir);
  assert.deepEqual(found.plugins, ["0.1.0", "0.1.0", "0.1.0"]);
  assert.deepEqual(found.markets, ["0.1.0", "0.1.0"]);
});
