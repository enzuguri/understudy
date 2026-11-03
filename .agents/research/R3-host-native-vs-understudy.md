# R3: What hosts do natively vs what Understudy must add

*Spike R3. Research only. Sources were checked on 31 Oct 2026. UNVERIFIED means the docs don't say.*

## Matrix

| Capability | Cursor | Claude Code | Codex | Understudy must add |
|---|---|---|---|---|
| **Context isolation** | Native. "Subagents start with a clean context"; only the final message returns ([subagents](https://cursor.com/docs/subagents)) | Native. Separate context window; only the result returns ([sub-agents](https://code.claude.com/docs/en/sub-agents)) | Native subagents ([subagents](https://developers.openai.com/codex/subagents)) | **Nothing.** Don't rebuild it |
| **Built-in delegates** | `explore`, `shell`, `generalPurpose`, with background and parallel modes | Explore, Plan, general-purpose, plus custom and fork modes | Built-in and custom TOML agents | Nothing. At most one or two named agents for evidence-heavy work |
| **When to delegate** | Model judgement from agent descriptions | Model judgement from descriptions; the docs list cases | Model judgement | **Yes: triggers and keep-inline list** (R1) |
| **Brief content** | The parent writes the prompt freely | Same; the docs say to restate rules in the brief | Same | **Yes: 5-field brief** (R1) |
| **Return size and shape** | No limit or shape. `subagentStop` sees `summary` and can send a follow-up ([hooks](https://cursor.com/docs/agent/hooks)) | No shape. `SubagentStop` can block | No shape. `SubagentStop` can continue the subagent | **Yes: ≤200-word return block and evidence tags.** Optional enforcement hook (R5) |
| **Evidence and hypothesis labels** | None | None | None | **Yes**, this is the main differentiator |
| **What subagents inherit** | UNVERIFIED for rules, AGENTS.md and sessionStart context | CLAUDE.md hierarchy (AGENTS.md if no CLAUDE.md), git status, preloaded skills. Explore and Plan skip CLAUDE.md. No auto memory | Developer context from `SubagentStart` hooks. AGENTS.md inheritance not checked | Put the return block in agent definitions, inject it at subagent start where possible, and rely on the brief elsewhere |
| **File hand-off** | `agent_transcript_path` exists, but it's a transcript, not a summary | Subagent transcripts on disk | Spill files for large hook output | **Yes: one `.agents/handoff/` convention** |
| **Cross-session memory** | Not researched in this spike; treat as UNVERIFIED | Auto memory (`MEMORY.md`), and a per-agent `memory:` field ([memory](https://code.claude.com/docs/en/memory)) | Memories, explicitly a "helpful recall layer"; required guidance belongs in AGENTS.md ([memories](https://developers.openai.com/codex/memories)) | **A host-neutral pointer** to the user's own markdown brain (R4). Don't duplicate host memory |
| **Static project guidance** | AGENTS.md and `.mdc` rules | CLAUDE.md, with AGENTS.md as fallback or import | AGENTS.md | Nothing. Users keep their own; Understudy ships no style or persona rules |
| **Context measurement** | `preCompact` gives `context_tokens` and usage % | `/context`, OTel `claude_code.token.usage` | Spill-to-file previews; no direct meter found | **Yes: R5 measurement harness**, to prove the firewall saves context |

## Reading the matrix
- The hosts handle **mechanics**: isolation, spawning, parallelism and transcripts. None of them gives **discipline**: when to delegate, what a brief contains, how big and how evidenced a return should be, or where bulky output goes. Understudy's product is that discipline layer plus a memory pointer.
- Most of what Understudy ships today replicates host features or holds personal preference:
  - 15 skills, 8 agents, a persona and a communication style
  - `coordination-artifact` (7 KB) and `hypothesis-handling` (5.3 KB)

  The useful core of those files fits in the roughly 475-token R1 contract.
- Discipline only helps when it is present at the moment of delegation, and that moment is model-initiated and unpredictable. Opt-in skills depend on the model choosing to load them, which is the failure mode the firewall exists to prevent.

## Conclusion: always-on core, opt-in depth
**Recommendation: always-on**, but limited to the R1 contract (about 475 tokens for the parent, about 150 per subagent). Everything else is opt-in:

| Layer | Mode | Contents |
|---|---|---|
| Core contract | **Always-on** (session-start hook or AGENTS.md fallback) | Triggers, brief, return, evidence, hand-off, brain pointer |
| Return block | **Always-on for subagents** where the host injects it (Claude, Codex); embedded in Understudy agents | ≤200-word return and evidence tags |
| Named agents | **Opt-in by use** (zero cost until spawned) | e.g. an evidence-first investigator and a log or test reader |
| Playbooks and skills | **Opt-in** | Long-form orchestration and review routing, moved out of the always-on payload |
| Second brain | **Pointer always-on, content on demand** | R4 |

Why not fully opt-in? An opt-in contract is absent exactly when the main agent decides to read a 3,000-line log inline. The cost of always-on is small: about 475 tokens, versus about 1,460 today on Cursor. The cost of missing one delegation is usually thousands of tokens.

## Open risks
- **Cursor subagent inheritance is UNVERIFIED.** If Cursor subagents see neither AGENTS.md nor the hook context, the return discipline on built-ins depends entirely on the parent's brief. That is the top live test.
- **Claude Explore and Plan skip CLAUDE.md.** Only a `SubagentStart` injection, or the brief, reaches them. This needs a live test (R2 test 5).
- **Always-on text competes with users' own guidance.** Phrase it factually and keep it short, and let users disable it: a `UNDERSTUDY_CONTRACT=off` env var or a plugin setting.
- **Host features move fast.** Cursor added `subagentStop` follow-ups, and Codex added `SubagentStart` context. Re-check this matrix each release; it belongs in the S3 per-host smoke tests.
