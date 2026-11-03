# Understudy research spikes R1–R4: summary

Research snapshot, 31 Oct 2026. Decisions since: hard constraints stay in the capped core; Claude Code and Cursor first, Codex deferred; second-brain location is user-configurable; live host tests not yet run.

*31 Oct 2026. Research only: nothing on GitHub was opened, changed or pushed, and nothing was committed. Sources are cited in each spike doc. UNVERIFIED claims are marked there.*

Files:
- [R1-firewall-contract.md](R1-firewall-contract.md)
- [R2-delivery-format.md](R2-delivery-format.md)
- [R3-host-native-vs-understudy.md](R3-host-native-vs-understudy.md)
- [R4-second-brain-pointer.md](R4-second-brain-pointer.md)
- Contract drafts: [contract/firewall-contract.md](contract/firewall-contract.md) and [contract/return-block.md](contract/return-block.md)

## Per-spike findings
**R1, the firewall contract.** The contract has two parts.
- **Parent contract** (~475 tokens, o200k): delegation triggers plus a keep-inline list; a 5-field brief (Goal, Scope, Known with labelled hypotheses, Done when, Return); and a return of 200 words or fewer (Verdict, Evidence, Paths, Open). Every claim is tagged CONFIRMED (with a source), HYPOTHESIS or UNVERIFIED. Hand-off goes to `.agents/handoff/<date>-<slug>.md`, and there's a one-line brain pointer.
- **Return block** (~150 tokens) for subagents.

Today's always-on payload on Cursor is about 1,460 tokens, so this is roughly a two-thirds cut that keeps the useful core of context-management, hypothesis-handling and coordination-artifact. The thresholds are guesses until R5 measures them.

**R2, the delivery format.** No single carrier works everywhere.
- Session-start hooks reach the main agent on Claude Code and Codex reliably.
- Cursor's hook is fire-and-forget and doesn't run in cloud agents.
- Codex plugin hooks need trust review and only work in manually installed desktop plugins.
- Subagent-start injection works on Claude and Codex but **not Cursor**, which can only allow or deny.
- Agent definition files are portable between Cursor and Claude: Cursor reads `.claude/agents`. Codex needs TOML.
- A plugin can't ship AGENTS.md, and Claude ignores AGENTS.md when a CLAUDE.md exists.

The recommendation is **one markdown source → generated glue**: a hook (SessionStart plus SubagentStart), embedded return blocks in agent definitions, and an AGENTS.md snippet as the fallback. Skills are for opt-in depth only, and MCP isn't needed for the firewall.

**R3, native vs Understudy.** All three hosts already provide isolation, spawning, parallelism and transcripts. None provides delegation *discipline*: triggers, brief shape, return size and shape, evidence labels or a hand-off convention. That discipline, plus a memory pointer, is Understudy's whole job. The conclusion is an **always-on, under-600-token core with everything else opt-in**, because an opt-in contract is missing exactly when the main agent decides to read a big log inline. The biggest unknown is whether Cursor subagents inherit any rules, AGENTS.md or hook context; the docs don't say.

**R4, the second-brain pointer.** The hook resolves the path in this order: `UNDERSTUDY_BRAIN`, then Claude `userConfig`, then `~/.config/understudy/config`. It emits one factual line, `Understudy brain: <path>`, pointing agents at `index.md`. Reads are on demand; never use Claude `@` imports, which inline the whole file and prompt for external paths. Cursor plugin `variables` are admin-set, so they don't suit a personal path. A read-only MCP server (MCPVault `--read-only`) is an optional layer.

The starter layout (`index.md`, `coding/`, `architecture/`, `debugging/`, `voice/`, `workflows/`, `tools/`, `inbox/`) takes the 10 MOVE items in 9 notes. The rules are:
- read-only by default
- writes only with explicit consent, and only into `inbox/`
- scoped reads
- the hook emits a path only, never content or secrets

## Combined recommendation
Understudy becomes a **thin, always-on delegation discipline layer**:
1. A ~475-token parent contract and a ~150-token subagent return block, kept as two markdown files. These are the single source of truth.
2. One generator renders them into:
   - a session-start hook (Claude, Cursor, Codex)
   - a SubagentStart injection (Claude and Codex)
   - return blocks embedded in a few named agents (`.md` for Claude and Cursor, `.toml` for Codex)
   - an AGENTS.md/CLAUDE.md snippet for hook-less contexts
3. Personal guidance, style and voices move to the user's plain-markdown brain. The plugin only points at it: read-only, on demand, consent to write.
4. Drop the always-on `.mdc` duplication on Cursor. CI enforces the token budget and carrier drift.

## Updated backlog proposal

| Order | ID | Change from the triage |
|---|---|---|
| 1 | **C1** Licence + 0.3.0 | Unchanged (needs Alex) |
| 2 | **C2** ADRs | Add ADR-0003 "Always-on core ≤600 tokens, everything else opt-in", ADR-0004 "One markdown source, generated host glue", ADR-0005 "Brain pointer: env → userConfig → config file; read-only" |
| 3 | **C3** Manifesto | Add the R3 framing: "hosts give isolation; Understudy gives discipline" |
| 4 | **R5** Measurement | Now also **tunes R1 thresholds** (200 lines / 5 files / 200 words). Sources: Claude OTel `query_source`, Cursor `subagentStop` (`message_count`, `tool_call_count`) and `preCompact` (`context_tokens`), Codex `SubagentStop` `last_assistant_message` |
| 5 | **S1** Move guidance out | Export into the R4 layout. Seed `index.md` with "read when…" lines |
| 6 | **S2** Drop and merge | Also retire `coordination-artifact` and `hypothesis-handling` as always-loaded content. Keep them as an opt-in playbook, or drop them |
| 7 | **S3a** Claude glue | SessionStart (all matchers) + SubagentStart `.*` + agents + `userConfig.brain_path` |
| 8 | **S3b** Cursor glue | `sessionStart` hook only (remove the `alwaysApply` rule), agents, cloud AGENTS.md snippet |
| 9 | **S3c** Codex glue (cheap tier) | Generated TOML agents and an AGENTS.md snippet. The plugin hook is optional because of the trust and desktop-only limits |
| 10 | **C4** CI | `node --test`, manifests, links, **payload token budget**, and a **generator drift check** |

S3a–c each start with the live tests listed below.

## Decisions for Alex
1. **Approve the always-on core at ≤600 tokens** and remove hard-constraints, communication style, persona and decision-making from the payload. They would move to your brain or be dropped.
2. **Cloud scope for v1.** Local folders aren't visible to Cursor cloud agents. Options: (a) v1 is local-only, (b) the brain is a git repo cloned into cloud runs, or (c) a hosted read-only MCP server. Recommendation: (a) for v1.
3. **Codex delivery tier.** Recommendation: the AGENTS.md snippet plus generated TOML agents as the default, with the plugin hook optional. The alternative is to invest in the hook path despite the trust gate and the desktop-only limit.

## Live tests needed from a cloud agent
1. Cursor subagents: do they receive AGENTS.md, rules or `sessionStart` context?
2. Cursor cloud: do plugin hooks run? (`sessionStart` is documented as not running there.)
3. Cursor: does the async `sessionStart` context land before the first turn?
4. Claude: does `SubagentStart` context reach Explore, Plan and plugin agents? Does `SessionStart` with `compact` re-inject?
5. Claude: in practice, is AGENTS.md ignored when CLAUDE.md exists? Does `userConfig.brain_path` reach the hook?
6. Codex: the plugin hook trust flow, `CLAUDE_PLUGIN_ROOT` expansion, invoking a generated TOML agent ([openai/codex#15250](https://github.com/openai/codex/issues/15250)), and the SubagentStart context.
7. Every host: env-var inheritance in GUI launches, versus the config-file fallback.
8. Optional enforcement: an over-long return caught by `SubagentStop` (Claude/Codex) or `subagentStop` `followup_message` (Cursor).
