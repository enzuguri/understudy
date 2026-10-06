"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const script = path.join(__dirname, "..", "hooks", "session-start.cjs");
const { detectHost, responseFor, skillBody } = require(script);

test("skillBody drops frontmatter and keeps the markdown body", () => {
  const body = skillBody("---\nname: session-start\ndescription: cue\n---\n\nFollow the budget.\n");
  assert.equal(body, "Follow the budget.");
});

test("skillBody is empty when the skill has no instructions yet", () => {
  assert.equal(skillBody("---\nname: session-start\ndescription: cue\n---\n"), "");
});

test("Claude SessionStart output carries the skill body as additionalContext", () => {
  const input = { hook_event_name: "SessionStart", source: "startup" };
  assert.equal(detectHost([], input), "claude");
  assert.deepEqual(responseFor("Follow the budget.", "claude"), {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "Follow the budget.",
    },
  });
});

test("Cursor sessionStart output carries the skill body as additional_context", () => {
  const input = { session_id: "s", is_background_agent: false, composer_mode: "agent" };
  assert.equal(detectHost(["--host=cursor"], input), "cursor");
  assert.equal(detectHost([], input), "cursor");
  assert.deepEqual(responseFor("Follow the budget.", "cursor"), {
    additional_context: "Follow the budget.",
  });
});

test("the CLI injects the installed skill body for both hosts", () => {
  const claude = spawnSync(process.execPath, [script], {
    input: JSON.stringify({ hook_event_name: "SessionStart", source: "startup" }),
    encoding: "utf8",
  });
  const cursor = spawnSync(process.execPath, [script, "--host=cursor"], {
    input: JSON.stringify({ session_id: "s", composer_mode: "agent" }),
    encoding: "utf8",
  });

  assert.equal(claude.status, 0, claude.stderr);
  assert.equal(cursor.status, 0, cursor.stderr);

  const claudeOut = JSON.parse(claude.stdout);
  const cursorOut = JSON.parse(cursor.stdout);
  const body = claudeOut.hookSpecificOutput.additionalContext;
  assert.equal(typeof body, "string");
  assert.equal(cursorOut.additional_context, body);
  assert.equal(claudeOut.additional_context, undefined);
  assert.equal(cursorOut.hookSpecificOutput, undefined);
});
