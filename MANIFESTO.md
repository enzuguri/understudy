# The Understudy Manifesto

The main agent is the lead. Its context is the stage, and every token on that stage should help the scene. Understudy does one job: it keeps the noise in the wings.

We value:

- **Firewalls over fluency.** Noisy work happens in a separate context and comes back as a verdict.
- **Compact returns over raw output.** A finding with evidence, not a transcript.
- **Plain files over host features.** Markdown on disk outlives every harness.
- **Pointers over payloads.** Say where knowledge lives; don't paste it into every session.
- **Evidence over assurance.** A claim crosses the firewall with proof, or labelled as a hypothesis.
- **Less over more.** Every always-on line is paid every session and spawn.

That is, while there is value in the items on the right, we value the items on the left more.

## Principles

1. **Delegate the noise.** Logs, test runs, searches and research belong behind a firewall. The lead keeps the plot.
2. **Fix the return shape.** Every delegation states what comes back and how big it may be.
3. **Portable by construction.** Use formats Cursor and Claude Code read natively: plain markdown, AGENTS.md-style guidance and agent definitions. Keep host glue thin and replaceable; other hosts wait until the discipline is proven here.
4. **Memory belongs to the user.** Guidance and memory live in the user's own plain-markdown second brain at a path they configure. Understudy points at it, reads on demand, and never owns it.
5. **Write it down, then hand it on.** Context moves between agents and sessions as files, not as recollection.
6. **Let the harness do what it already does.** Don't rebuild native subagents, compaction or memory. Add only the discipline the host lacks.
7. **Cap the core, keep the rails.** The always-on payload stays under about 600 tokens. That budget is tight, but the hard constraints are not optional — they stay in the core on every session and every spawn.
8. **Prove the saving.** If we can't measure the context a firewall saves, it doesn't ship.

## Not ours

Coding rules, style guides, workflow playbooks, personas, model routing and memory stores. Others do these well, and the user's second brain holds the rest.

## Open questions

- What do Cursor subagents inherit from rules, AGENTS.md or session-start context? Live tests still needed.
- How does a user-configured brain reach Cursor cloud agents, which cannot see a local folder?
