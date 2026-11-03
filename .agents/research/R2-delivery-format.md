# R2: Delivery format for the contract

*Spike R2. Research only. "VERIFIED" means I checked the claim against the official docs on 31 Oct 2026. "UNVERIFIED" means the docs are silent or unclear, and it needs a live test.*

## Question
Which carrier should get the R1 contract to the main agent, and the return block to subagents, on Cursor and Claude Code, and on Codex where that's cheap? I judged each carrier on portability, load cost, reliability and maintenance.

## Carrier comparison

| Carrier | Cursor | Claude Code | Codex | Load cost | Reliability | Maintenance |
|---|---|---|---|---|---|---|
| **AGENTS.md snippet** (user or repo file) | Read natively, nested files merged (VERIFIED, [rules](https://cursor.com/docs/rules)) | Read **only if there's no CLAUDE.md** in the cwd or above. Otherwise CLAUDE.md has to `@AGENTS.md` it. Needs v2.1.277+ (VERIFIED, [memory](https://code.claude.com/docs/en/memory)) | Read natively, global and per-directory, 32 KiB cap (VERIFIED, [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md)) | Always-on, the full text | High once it's in place | **A plugin can't ship it.** The user has to paste or merge it, and it drifts |
| **Session-start hook** (plugin-shipped) | `sessionStart` → `additional_context`. Fire-and-forget. **Doesn't run in cloud agents** (VERIFIED, [hooks](https://cursor.com/docs/agent/hooks)) | `SessionStart` → `additionalContext`, 10,000-char cap, runs on startup/resume/clear/compact (VERIFIED, [hooks](https://code.claude.com/docs/en/hooks)) | `SessionStart` → `additionalContext`, spills past about 2,500 tokens. Plugin hooks need user **trust review**, and only work in **manually installed desktop plugins** (VERIFIED, [hooks](https://developers.openai.com/codex/hooks), [build plugins](https://developers.openai.com/codex/plugins/build)) | Always-on, the full text. Re-injected after compaction on Claude and Codex | High on Claude. Medium on Cursor (async; no cloud). Medium on Codex (trust gate) | One script already handles both shapes (`hooks/session-start.cjs`) |
| **Subagent-start injection** | `subagentStart` can only allow or deny. **No context injection** (VERIFIED) | `SubagentStart` → `additionalContext` into the subagent, with a matcher per agent type (VERIFIED) | `SubagentStart` → `additionalContext` "for the subagent" (VERIFIED) | About 150 tokens per subagent | High where it's supported | Same script, one more event |
| **Agent definitions** (markdown + YAML) | Reads `.cursor/agents`, `.claude/agents` and `.codex/agents`, project and user (VERIFIED, [subagents](https://cursor.com/docs/subagents)). Cursor plugins ship `agents/` (VERIFIED, [plugin ref](https://cursor.com/docs/reference/plugins)) | `.claude/agents/*.md`, plugin `agents/`. Frontmatter includes `skills`, `memory`, `hooks`, `omitClaudeMd` (VERIFIED) | **TOML** in `~/.codex/agents` or `.codex/agents` (`name`, `description`, `developer_instructions`). Codex plugins don't list agents as a component (VERIFIED, [subagents](https://developers.openai.com/codex/subagents)). Invoking by name can fail in tool-backed sessions ([openai/codex#15250](https://github.com/openai/codex/issues/15250)) | Zero until spawned. Descriptions cost a little (Claude warns at 15k tokens) | High for *named* agents. Doesn't touch the built-in or general-purpose subagents | One markdown source → generate a TOML copy for Codex |
| **Skills** | Supported | Supported; `skills:` preloads into subagents | Supported | On demand: description always, body when it's loaded | **Low for a contract**: loading depends on the model choosing to | Fine for opt-in playbooks, wrong for the core |
| **Rules (.mdc, alwaysApply)** | Cursor only; plugins ship `rules/` | No plugin rules component | None | Always-on | High, Cursor only | Today this double-loads with the hook on Cursor |
| **MCP server** | Yes | Yes | Yes | Tool schemas are always-on. Content is pulled on demand | Depends on the model calling it | Extra process. **Not needed for the firewall.** Optional for the second brain (R4) |

Cross-host shortcuts (VERIFIED):
- Cursor loads Claude Code hooks from `.claude/settings*.json` when "Third-Party Imports" is on, which is the default. Its event mapping doesn't include `SubagentStart` ([third-party hooks](https://cursor.com/docs/reference/third-party-hooks)).
- Codex sets `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` for plugin hooks. Its `SessionStart` output shape is the same as Claude's.

## Recommendation
**Primary format:** two plain-markdown source files, the R1 contract and the return block, rendered by **one hook script** and **generated agent definitions**. Don't use skills for the core.

Thin glue for each host:
1. **Claude Code (plugin):**
   - `hooks/hooks.json` with `SessionStart` (all matchers), so the contract survives compaction.
   - `SubagentStart` (matcher `.*`) injects the return block into *every* subagent, built-ins included.
   - Understudy agents in `agents/` also embed the return block, as a backstop.
2. **Cursor (plugin):**
   - `sessionStart` hook for the contract.
   - Drop the always-apply `hard-constraints.mdc`, because today it doubles the load.
   - Understudy agents in `agents/` with the return block embedded.
   - For **cloud agents**, where `sessionStart` doesn't run, ship a documented AGENTS.md snippet, generated from the same source, for users to add.
   - The return block reaches built-in subagents only through the parent's brief: the contract's "Return" field.
3. **Codex (cheap tier):**
   - The same `hooks/hooks.json`. Codex reads it from plugins, gated by trust review.
   - Generated `.codex/agents/*.toml`.
   - The AGENTS.md snippet as the documented default, because plugin hooks only work in manually installed desktop plugins.
4. **One generator** (`make carriers`) writes the hook payload, the agent `.md` and `.toml` files, and the AGENTS.md snippet from the two sources. CI fails on drift and on a budget overrun (C4).

## Needs a live test by a cloud agent
1. Cursor: does `sessionStart` `additional_context` reach **subagents**, or only the parent?
2. Cursor: do subagents see AGENTS.md, project rules or user rules? The docs are silent.
3. Cursor: do **plugin** hooks run in cloud agents? The docs list project `.cursor/hooks.json`, team and enterprise hooks as cloud sources, say user hooks are unavailable, and don't mention plugin hooks. Hooks also don't run during cloud agents' early read-only turns (VERIFIED, [hooks](https://cursor.com/docs/agent/hooks)).
4. Cursor: does the async `sessionStart` land before the first model turn, every time? The docs say the desktop app 'waits only a short time for hooks to load' unless an Enterprise admin enables *Block until hooks are ready*.
5. Claude Code: does `SubagentStart` `additionalContext` reach the built-in Explore and Plan agents and plugin-scoped agents? Does `SessionStart` with `compact` re-inject?
6. Claude Code: does an over-long return get caught by a `SubagentStop` check, and is the rewrite usable?
7. Codex: a plugin `SessionStart` hook after trust review, `${CLAUDE_PLUGIN_ROOT}` expansion in the command string, and a generated TOML agent being invoked (including the #15250 case).
8. Cross-host: the `detectHost()` heuristic in `hooks/session-start.cjs`. Codex input has `hook_event_name`, so it gets the Claude shape, which is correct, but untested.

## Open risks
- Cursor has no subagent-side injection, so the return discipline on built-in Cursor subagents relies on the parent writing good briefs.
- Hook payloads are opaque to users. Show the injected text in the README, and keep it short and factual.
- Codex's agent and plugin formats are documented as liable to change ("may evolve"). Keep Codex glue generated, never hand-edited.
- The AGENTS.md fallback is user-maintained and will drift from the plugin version. Stamp it with a version line so drift is visible.
