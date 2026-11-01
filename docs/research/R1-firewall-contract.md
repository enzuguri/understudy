# R1 — Host-neutral firewall contract

*Spike R1 for Understudy. Research only; nothing has been committed or pushed. en-GB.*

## Question
What is the smallest always-on text that makes any host's main agent delegate noisy work and get compact, evidenced returns, whatever host it runs on (Cursor, Claude Code, Codex)?

## What the evidence says
- **All three hosts already isolate context.** Subagents start with a clean context and return only their final message. Sources: Cursor <https://cursor.com/docs/subagents> ("Subagents start with a clean context… returns a final message"), Claude Code <https://code.claude.com/docs/en/sub-agents> ("fresh, isolated context window"), and Codex <https://developers.openai.com/codex/subagents>. What is missing is *discipline*: when to delegate, what to send and what comes back. See R3.
- **Hosts reward short, factual guidance.**
  - Claude's hook docs say: "For instructions that never change, prefer CLAUDE.md". They also warn that imperative "system-style" text in hook context "can trigger Claude's prompt-injection defenses" (<https://code.claude.com/docs/en/hooks>).
  - Claude's memory docs target under 200 lines per CLAUDE.md, and say that imports "don't reduce its context cost" (<https://code.claude.com/docs/en/memory>).
  - Codex spills hook context over about 2,500 tokens to disk and passes only a preview, adding: "Context from multiple hooks and plugins adds up and can degrade model performance" (<https://developers.openai.com/codex/hooks>).
- **The main agent's view of Claude-native subagents is lossy by design.** Claude's docs say most rules don't need to reach the subagent; if a rule must, "restate it in the prompt you give Claude when delegating" (sub-agents doc, "What loads at startup"). So the *brief* carries the constraints, and the contract has to say what a brief contains.
- **Existing Understudy material** is the basis, compressed:
  - `skills/context-management` covers the delegation triggers and hand-off logs.
  - `skills/hypothesis-handling` covers the hypothesis-labelling rule and the CONFIRMED/REFUTED vocabulary.
  - `skills/coordination-artifact` covers file-based coordination.

  Together with the current session payload, `skills/session-start/SKILL.md` and `rules/hard-constraints.mdc` total about 1,460 tokens, and Cursor loads both of the last two (see "Measured size" below).

## The contract (two parts)
The draft text is in [`contract/firewall-contract.md`](contract/firewall-contract.md) (parent side) and [`contract/return-block.md`](contract/return-block.md) (subagent side). In outline:

| Element | Rule (as drafted) |
|---|---|
| **When to delegate** | The work is read-only and any of these hold: likely more than about 200 lines of output, more than about 5 files, a log, test run, build, trace or diff to read, a multi-source search or comparison, or waiting or polling. Keep inline: one-file reads, small edits, anything that needs the user, and decisions. Writes and destructive actions stay with the main agent unless delegated explicitly. |
| **Brief shape** | Five fields: **Goal**, **Scope** (in and out of bounds), **Known** (facts with sources; beliefs labelled *hypothesis* with reasoning, to confirm or refute), **Done when**, and **Return** (shape plus a hand-off path). |
| **Return shape and budget** | 200 words or fewer by default: a **Verdict** line first, then **Evidence**, **Paths** and **Open**. No raw logs, no full files and no step narrative. |
| **Evidence rules** | Every claim is tagged CONFIRMED (with file:line, a command and its result, or a URL), HYPOTHESIS, or UNVERIFIED (with what blocked it). "Absence of an error is not success." Subagents restate any hypothesis they are given and try to refute it first. |
| **File hand-off** | Output too large for a return goes to `.agents/handoff/<YYYY-MM-DD>-<slug>.md` (gitignored), and the return cites the path. Later agents read the file, not the earlier transcript. This replaces the current `.agents/logs/…/exploration.md` and coordination-artifact conventions with one path. |
| **Second-brain pointer** | One sentence. It refers to an `Understudy brain:` line that the hook injects (R4). It says to read `index.md` first and open only relevant notes, and that writing needs consent. |

The parent text is written as statements and short rules rather than "You MUST…" commands, following Claude's prompt-injection guidance above.

## Measured size
Counts are tiktoken `o200k_base` and `cl100k_base` on the box (31 Oct 2026). Claude uses a different tokeniser, so treat these as ±20% proxies and confirm with Claude's `/context` (<https://code.claude.com/docs/en/context-window>).

| Text | Characters | Words | Tokens (o200k / cl100k) |
|---|---|---|---|
| `contract/firewall-contract.md` (parent, always-on) | 2,023 | 337 | **475 / 479** |
| `contract/return-block.md` (per subagent) | 613 | 100 | **152 / 153** |
| Current `skills/session-start/SKILL.md` (always-on today) | 3,413 | 491 | 740 / 739 |
| Current `rules/hard-constraints.mdc` (also always-on in Cursor) | 3,329 | 478 | 723 / 721 |

On Cursor today the always-on total is about 1,460 tokens. The draft is about 475, roughly a two-thirds cut. That is about 4.8% of Claude's 10,000-character `additionalContext` cap, and under a fifth of Codex's default 2,500-token hook spill threshold.

## Recommendation
1. **Adopt the two-part contract as the single source of truth**: one markdown file for the parent and one return block. Every carrier (R2) is generated from these files; no carrier gets hand-written copies.
2. **Keep it always-on and keep it under 600 tokens.** Make the cap a CI budget check (backlog item C4).
3. **Move everything else out of the always-on payload.** Most of today's session-start content isn't about the firewall: the hard constraints, communication style, the target-audience persona and decision-making. Those go to the user's second brain (R4) or are dropped. The "No destructive git ops" and "Plan approval ≠ code approval" lines are generic safety rules, not firewall rules. They belong in the user's own guidance.
4. **Embed the return block in every Understudy agent definition**, since all three hosts read their agent files. Also inject it into subagents at start where the host allows it: Claude and Codex `SubagentStart`; Cursor can't (R2).

## Open risks
- **Thresholds are guesses.** The ~200 lines, ~5 files and 200 words limits aren't measured. R5 should tune them using Claude OTel `query_source` splits and Cursor `subagentStop` data (`message_count`, `tool_call_count`, `modified_files`).
- **Return budgets are advisory.** Nothing enforces 200 words. A Claude or Codex `SubagentStop` hook could block an over-long return and ask for a rewrite, and Cursor's `subagentStop` can add a `followup_message`. Both are unproven and need a live test.
- **Over-delegation costs latency and tokens.** Cursor's docs warn subagents "can be slower… The benefit is context isolation, not speed". The keep-inline list is the only guard.
- **Cursor subagents may not see AGENTS.md or rules at all.** The Cursor docs don't say (UNVERIFIED). Built-in Explore-type agents on Claude skip CLAUDE.md by design. So the return block has to travel inside the brief or the agent definition, not only in always-on guidance.
- **Hand-off files can leak into commits** unless `.agents/handoff/` is gitignored. The installer or README should say so.
