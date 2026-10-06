"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const skill = fs.readFileSync(path.join(root, "skills/discover-repo-map/SKILL.md"), "utf8");

test("framework detection runs from manifests before entry-point search", () => {
  const frameworks = skill.indexOf("### 3. Frameworks");
  const entryPoints = skill.indexOf("### 4. Entry points");
  assert.ok(frameworks !== -1, "repo-map procedure has no Frameworks step");
  assert.ok(entryPoints > frameworks, "entry-point search must follow framework detection");
  assert.match(skill, /references\/frameworks\.md/);
  assert.match(skill, /manifest signal/);
  assert.match(skill, /unlisted/);
  assert.match(skill, /n\/a — searched/);
});

test("the cache template records frameworks and the files that evidenced them", () => {
  const cache = skill.indexOf("## Cache file");
  const template = skill.slice(cache);
  assert.match(template, /## Frameworks/);
  assert.match(template, /framework config file used as evidence/);
});

test("the framework catalog lists the starting manifest signals", () => {
  const catalog = fs.readFileSync(
    path.join(root, "skills/discover-repo-map/references/frameworks.md"),
    "utf8",
  );
  for (const signal of ["next", "express", "fastify", "@trpc/server", "`bin`"]) {
    assert.ok(catalog.includes(signal), `catalog missing ${signal}`);
  }
  assert.match(catalog, /not a match on its own/);
});

test("orient-agent reports cached frameworks", () => {
  const agent = fs.readFileSync(path.join(root, "agents/orient-agent.md"), "utf8");
  const schema = agent.slice(agent.indexOf("## Output Schema"));
  assert.match(schema, /frameworks:/);
});
