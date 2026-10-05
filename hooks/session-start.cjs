#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const PLUGIN_ROOT = path.resolve(__dirname, "..");
const SKILL_PATH = path.join(PLUGIN_ROOT, "skills", "session-start", "SKILL.md");

function skillBody(text) {
  const source = String(text == null ? "" : text).replace(/^\uFEFF/, "");
  const fenced = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  const body = fenced ? source.slice(fenced[0].length) : source;
  return body.replace(/^\n+/, "").replace(/\s+$/, "");
}

function detectHost(argv, input) {
  const args = Array.isArray(argv) ? argv : [];
  if (args.includes("--host=cursor")) return "cursor";
  if (input && typeof input === "object") {
    if (input.hook_event_name || input.hookEventName) return "claude";
    if (
      Object.prototype.hasOwnProperty.call(input, "composer_mode") ||
      Object.prototype.hasOwnProperty.call(input, "is_background_agent") ||
      Object.prototype.hasOwnProperty.call(input, "session_id")
    ) {
      return "cursor";
    }
  }
  return "claude";
}

function responseFor(body, host) {
  const text = body == null ? "" : String(body);
  if (host === "cursor") return { additional_context: text };
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: text,
    },
  };
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch (err) {
    if (err && (err.code === "EAGAIN" || err.code === "EOF")) return "";
    throw err;
  }
}

function installedSkillBody() {
  try {
    return skillBody(fs.readFileSync(SKILL_PATH, "utf8"));
  } catch {
    return "";
  }
}

function main() {
  let input = {};
  const raw = readStdin().trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") input = parsed;
    } catch {
      input = {};
    }
  }
  const host = detectHost(process.argv.slice(2), input);
  process.stdout.write(JSON.stringify(responseFor(installedSkillBody(), host)) + "\n");
  process.exit(0);
}

module.exports = {
  detectHost,
  responseFor,
  skillBody,
};

if (require.main === module) main();
