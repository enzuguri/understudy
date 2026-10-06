# Understudy Agent Plugin

A plugin for context management and firewalls when using agent harnesses, tailored to Alex Fell's tastes.

## Motivation

Agent contexts can get quite large when everything runs in the main orchestration thread. There are a large category of activities that do not need to run in the main context and can be fanned out to sub-agents.
These categories have been discovered to work well:

- reading logs
- git operations
- verification (running tests, lint, formatting)
- background research

This repo is a set of skills and agent instructions to try and force these context firewalls, and is very specific about trying to enforce these.

## Layout

This repository follows [Agent Plugins 1.0](https://agent-plugins.org/specification) for portable components and provides Claude Code and Cursor custom agents through their client-specific plugin formats.

```text
understudy/
├── plugin.json                      # Agent Plugins 1.0 manifest
├── skills/                          # Portable Agent Skills
├── agents/                          # Cursor + Claude Code custom agents
├── rules/                           # Cursor always-on rules
├── hooks/hooks.json                 # Claude Code / Codex session-start hook
├── hooks/com.cursor/hooks.json      # Cursor session-start hook
├── hooks/session-start.cjs          # Injects the session-start skill body
├── .cursor-plugin/plugin.json       # Cursor Plugin manifest
├── .cursor-plugin/marketplace.json  # Cursor local-folder / marketplace catalog
├── .claude-plugin/plugin.json       # Claude Code plugin manifest
└── .claude-plugin/marketplace.json  # Claude Code marketplace catalog
```

Portable clients discover `plugin.json` and `skills/`. Agents, rules, and hooks are outside Agent Plugins v1. Claude Code and Codex auto-load `hooks/hooks.json`. Cursor loads `hooks/com.cursor/hooks.json` from `.cursor-plugin/plugin.json`. Do not also list `hooks/hooks.json` on the Claude manifest; that path is loaded automatically.

## Installation

### Cursor

In Customize, add this repository as a local marketplace folder (Cursor looks for `.cursor-plugin/marketplace.json`). Then install the `understudy` plugin from that catalog and confirm skills, agents, and rules appear.

Alternatively copy the repo to `~/.cursor/plugins/local/understudy` and reload the window.

### Claude Code

Add this directory as a marketplace (`claude plugin marketplace add /path/to/understudy`), then `claude plugin install understudy@understudy`. Or load it with `--plugin-dir`. Confirm agents and skills with `claude plugin details understudy`.

### Other Agent Plugins clients

Point the client at this directory. It MUST load root `plugin.json` (`$schema` `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`) and discover skills from `skills/*/SKILL.md`. There is no `mcp.json`; MCP is optional and omitted on purpose.

## Versioning

Plugin clients refresh when the version in the manifests changes. Bump every manifest together with [bumpp](https://github.com/antfu-collective/bumpp):

```sh
make bump-version                 # patch, the default
make bump-version PART=minor
make bump-version PART=major
```

`PART` is `patch`, `minor`, or `major`. The target updates the version in:

- `plugin.json`
- `.cursor-plugin/plugin.json`
- `.cursor-plugin/marketplace.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

It does not commit, tag, or push. Review the diff and commit it yourself.

## Components

| Kind | Location | Role |
| --- | --- | --- |
| Skills | `skills/` | Delegation playbooks, discovery caches, review/PR routing, revoice, session-start |
| Agents | `agents/` | Context-firewall subagents (`git-agent`, `log-reader`, `verification-agent`, …) |
| Rules | `rules/` | Always-on style, tooling, error-handling, and hard constraints (Cursor) |
| Hooks | `hooks/` | Session start injects the body of `skills/session-start/SKILL.md` on Claude Code, Codex, and Cursor |
