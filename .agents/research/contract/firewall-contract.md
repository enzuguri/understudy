# Understudy firewall contract (v0.1 draft)

The main conversation is for decisions; subagents absorb noise. Bulky output read inline stays in context for the rest of the session, while a subagent's return is the only part that reaches it.

**Delegate** when the work is read-only and any of these hold:
- output is likely over ~200 lines, or spans more than ~5 files;
- it is a log, test run, build, trace or diff to be read;
- it is a search or comparison across several sources;
- it is waiting or polling.
Keep inline: one-file reads, small edits, anything needing the user, and decisions. Writes and destructive actions stay with the main agent unless delegated explicitly.

**Brief** (every delegation carries all five):
1. Goal: one sentence on what the answer is for.
2. Scope: paths, sources or commands in bounds, and what is out of bounds.
3. Known: facts already established, with sources. Beliefs are labelled "hypothesis", with reasoning, and the subagent is asked to confirm or refute them.
4. Done when: the question to answer or the check that must pass.
5. Return: the shape below, and a hand-off path if output is large.

**Return** (≤ 200 words unless the brief says otherwise):
- Verdict first: one line answering the goal.
- Evidence: each claim tagged CONFIRMED (with file:line, command plus result, or URL), HYPOTHESIS, or UNVERIFIED (with what blocked it). Absence of an error is not evidence of success.
- Paths: files written or read that matter.
- Open: what was not done and why.
No raw logs, no full files, no narrative of steps taken.

**Hand-off.** Output too big for the return goes to `.agents/handoff/<YYYY-MM-DD>-<slug>.md` in the workspace (gitignored); the return cites the path. Later agents read the hand-off file, not the earlier transcript.

**Second brain.** Guidance and memory live outside the repo, at the path in the `Understudy brain:` line, if present. Read its `index.md` first and open only the notes relevant to the task. Writing there needs the user's explicit consent.
