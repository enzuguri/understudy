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
├── plugin.json                 # Agent Plugins 1.0 manifest
├── skills/                     # Portable Agent Skills
├── agents/                     # Cursor + Claude Code custom agents
├── rules/                      # Cursor always-on rules
├── .cursor-plugin/plugin.json  # Cursor Plugin manifest
└── .claude-plugin/plugin.json  # Claude Code plugin manifest
```

Portable clients discover `plugin.json` and `skills/`. Agents and rules are outside Agent Plugins v1; they load only through the Cursor and Claude Code manifests.

## Installation

### Cursor

Copy or clone this repository to `~/.cursor/plugins/local/understudy`, then reload the window. Confirm skills, agents, and rules appear under Customize. Team marketplaces can also import the repo; Cursor detects Agent Plugins from root `plugin.json` and Cursor-specific components from `.cursor-plugin/plugin.json`.

### Claude Code

Load the plugin directory with `--plugin-dir /path/to/understudy`, or add it to a marketplace whose `.claude-plugin/marketplace.json` points at this folder. Enable the plugin, then confirm agents and skills with `claude plugin details understudy`.

### Other Agent Plugins clients

Point the client at this directory. It MUST load root `plugin.json` (`$schema` `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`) and discover skills from `skills/*/SKILL.md`. There is no `mcp.json`; MCP is optional and omitted on purpose.

## Components

| Kind | Location | Role |
| --- | --- | --- |
| Skills | `skills/` | Delegation playbooks, discovery caches, review/PR routing, revoice |
| Agents | `agents/` | Context-firewall subagents (`git-agent`, `log-reader`, `verification-agent`, …) |
| Rules | `rules/` | Always-on style, tooling, error-handling, and hard constraints (Cursor) |
