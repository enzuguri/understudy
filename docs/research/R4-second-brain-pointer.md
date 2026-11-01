# R4: Pointing agents at the user's second brain

*Spike R4. Research only. Working assumption: the reference brain is a **plain markdown folder**, one store shared across projects. Obsidian and MCP are optional layers on top.*

## Question
How does Understudy tell each host where the brain lives, and how should agents read it, without bulk-loading it or ever writing to it unasked?

## Pointer mechanisms

| Mechanism | Hosts | Load cost | Notes (sources) |
|---|---|---|---|
| **Env var `UNDERSTUDY_BRAIN`** read by the session-start hook | All three (the hook runs in the user's environment) | ~20 tokens (one line) | GUI-launched apps may not inherit shell rc files (UNVERIFIED per host), so a file fallback is needed. Cursor `sessionStart` can also set `env` for later hooks ([Cursor hooks](https://cursor.com/docs/agent/hooks)) |
| **Config file** `~/.config/understudy/config` (`brain = /path`) | All three | Same | Fallback when the env var is missing. Works the same in GUI and CLI sessions |
| **Claude plugin `userConfig`** (`brain_path`) | Claude Code | Same | Prompted on enable. Available as `${user_config.brain_path}` in hook args and as `CLAUDE_PLUGIN_OPTION_BRAIN_PATH` ([plugins-reference](https://code.claude.com/docs/en/plugins-reference)) |
| **Cursor plugin `variables`** | Cursor | Same | Set by **team admins** in the dashboard and aimed at `mcp.json` ([plugins](https://cursor.com/docs/reference/plugins)). A poor fit for a personal path; substitution into hooks is UNVERIFIED |
| **AGENTS.md pointer line** (user-written) | All three; on Claude only via CLAUDE.md or without one ([memory](https://code.claude.com/docs/en/memory)) | Same | Covers Cursor cloud and untrusted Codex hooks. Has to be hand-maintained |
| **Claude `@path` import** | Claude Code | **The whole file, every session**; imports are inlined and "don't reduce context cost". External paths raise an approval dialog ([memory](https://code.claude.com/docs/en/memory)) | **Avoid** for the brain. Fine only for a tiny `index.md` if the user opts in |
| **Cursor rule `@file`** | Cursor | On demand: referenced files are read when needed, not inlined ([rules](https://cursor.com/docs/rules)) | Acceptable, but rules need `.mdc` in the project or the plugin |
| **Read-only MCP** over the folder | All three | Tool schemas are always-on; content comes on demand | Optional layer for search and backlinks. Candidates: MCPVault with `--read-only`, basic-memory (AGPL, so keep it a user choice). Codex and Cursor-cloud MCP config differ per host |

## Recommendation
1. **Resolve the path in the hook.** Order: `UNDERSTUDY_BRAIN`, then Claude `userConfig`, then `~/.config/understudy/config`, then nothing. If a path is found, emit two factual lines inside the contract:
   `Understudy brain: <path> (read-only; start at <path>/index.md, open only notes relevant to the task).`
   If not, emit nothing, and the contract's pointer sentence goes dormant.
2. **Read on demand, never import.** Agents read `index.md` first and open only the linked notes. Subagents get the relevant note *paths* in the brief's **Known** field, not the content.
3. **Fallback for hook-less contexts** (Cursor cloud, Codex without trust, Claude with a CLAUDE.md): a one-line AGENTS.md or CLAUDE.md snippet, generated with the contract snippet (R2).
4. **MCP stays optional.** Document MCPVault `--read-only` as the reference setup for users who want search. Understudy doesn't ship or require a server.

## Starter layout (receives the 10 MOVE items)
```
<brain>/
  index.md            # one line per note: path, what it's for, when to read it
  coding/
    code-style.md     # ← rule: code-style
    error-handling.md # ← rule: error-handling
    types.md          # ← skill: types
  architecture/
    boundaries.md           # ← skill: boundaries
    discover-boundaries.md  # ← skill: discover-boundaries (procedure)
  debugging/
    failure-modes.md  # ← skill: failure-modes
  voice/
    revoice.md        # ← skill: revoice + agent: re-voicer (merged)
  workflows/
    slack-insights.md # ← skill: slack-insights
  tools/
    tooling.md        # ← rule: tooling
  inbox/              # the ONLY place agents may write, and only with consent
```
That's 10 items in 9 files, because `revoice` and `re-voicer` merge. Each note opens with a one-line "read when…" line, which `index.md` mirrors so agents can choose without opening files. The layout is plain markdown and opens as-is in Obsidian. Wikilinks are optional, so they don't break plain-file reading.

## Privacy and scope rules (for the contract and README)
- **Read-only by default.** Agents never create, edit, move or delete brain files without the user's explicit consent in the current conversation. Approving a plan doesn't count as consent to write memory.
- **With consent, write only to `inbox/`**, one new dated file per capture. The user curates it into the tree.
- **Scoped reads.** Open only the notes needed for the current task. Never bulk-read, summarise or copy the brain into a repo, a hand-off file, a commit or an external service.
- **No secrets in the brain or in hook payloads.** Codex may spill large hook output to a file on disk ([Codex hooks](https://developers.openai.com/codex/hooks)), and Claude spills over 10,000 characters ([Claude hooks](https://code.claude.com/docs/en/hooks)). The hook emits the path only, never content.
- **Project vs personal.** Repo-specific guidance stays in the repo's AGENTS.md. The brain holds cross-project, personal knowledge.

## Open risks
- **Cloud agents can't see a local folder.** Cursor cloud VMs have no access to the home directory ([Cursor hooks](https://cursor.com/docs/agent/hooks)). For cloud use, the brain has to be a git repo or reached through a hosted MCP server. Decide whether cloud is in scope for v1.
- **Env-var inheritance in GUI hosts is UNVERIFIED.** That's why the config file exists; the S3 smoke tests should check it.
- **Agents may still over-read** a large brain. Keep `index.md` short, and measure note opens per session in R5.
- **The consent rule is advisory.** A Claude or Cursor `preToolUse` gate that denies writes under `<brain>/` outside `inbox/` would enforce it. That's possible, but it's extra hook surface: propose it as opt-in.
