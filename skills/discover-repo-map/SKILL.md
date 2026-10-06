---
name: discover-repo-map
description: Builds a repo-level orientation map — runtime and build system, frameworks, entry points, conventions (naming, imports, error handling, logging, tests), hotspots from git history, and repo-wide gotchas — and caches it at `.agents/context/repo-map.md`. Invoke on first work in an unfamiliar repo or when that cache is stale. Repo-level and cached; task-specific orientation ("where do I change X?") is `orient-agent`, which reads this cache.
context: fork
agent: orient-agent
---

# Discover Repo Map

Produce `.agents/context/repo-map.md` — the facts about a repo that hold across
tasks. `orient-agent` reads it instead of re-orienting from scratch every run, and
spends its own budget on the task.

Scope test for anything you record: *would this still be true for an unrelated task
next week?* If not, it belongs in a task exploration, not here.

## Read budget
Structural anchors (`package.json`, `tsconfig.json`, `pyproject.toml`,
`build.gradle*`, `Dockerfile`, `docker-compose.yml`, `.nvmrc`) are exempt. Beyond
those, **max 5 Reads** of source files, for convention sampling only. This budget is
separate from `orient-agent`'s task budget when it runs this procedure inline.

---

## Lookup protocol

Run before any discovery. A repo map changes far less often than the code, so —
unlike `boundaries.md` — a new commit alone does not invalidate it.

1. **No cache file** → discover.
2. **`git merge-base --is-ancestor <git_sha> HEAD` fails** (history rewritten, or a different branch line) → discover.
3. **`generated_at` older than `ttl_days`** → discover.
4. **`git diff --name-only <git_sha> HEAD -- <sources...>` is non-empty** (a manifest or config the map was built from changed) → discover.
5. **`git diff --name-only --diff-filter=ADR <git_sha> HEAD` touches a directory listed under Entry Points** → discover.
6. **Otherwise** → use as-is; report `cache: fresh` with which checks ran.

Manual invalidation: `rm .agents/context/repo-map.md`.

---

## Discovery procedure

Run independent commands in one batched Bash block per step.

### 1. Git history
```bash
git rev-parse HEAD; git branch --show-current
git log --oneline -20                                   # cadence, commit style
git log --since=90.days --name-only --format= | sort | uniq -c | sort -rn | head -15   # hotspots
```

### 2. Config and runtime
Read the structural anchors that exist. Infer: runtime and version, package
manager, build system, path aliases, monorepo/workspace layout.

### 3. Frameworks
Read `references/frameworks.md` (relative to this skill's base directory) and match it
against the manifests already read in step 2. That reference is part of this skill,
so the Read does not consume the 5-Read source budget.

A catalog row matches only when its manifest signal is present. In a workspace,
match every package manifest the root declares; those reads are structural anchors.
A confirm pattern or directory in the catalog supports a manifest hit. It is not
a match on its own, and identity comes from the manifest signal.

Record every matching row. A dependency you recognize as an application, HTTP,
RPC, or CLI framework with no catalog row is `unlisted`: record the package name
and the manifest, and leave its entry-point pattern unset. When no row matches
and nothing is unlisted, record `n/a — searched <manifest paths>`.

### 4. Entry points
Find the edges of the graph, don't sample random files:
```bash
fd -e ts -e js -e py 'main|index|server|app|cli' --type f -E node_modules
```
Then apply the entry-point pattern from `references/frameworks.md` for each catalog
framework recorded in this run. When Frameworks is `n/a — searched <manifest paths>`,
or contains only `unlisted` rows, record `entry-point patterns: none applied` and
stop after the generic search.

### 5. Conventions
Infer from existing code — never assume. Sample from hotspot files (they reflect
current style, not legacy), plus one test file. Use `rg` first to choose samples:
- Naming: files, functions, types
- Imports: relative vs alias, barrel files
- Error handling: throw vs Result, custom error types
- Logging: library, structured or not
- Tests: co-located vs `__tests__`, runner, naming

If `references/project-conventions.md` (relative to this skill's base directory)
would help on an unusual stack,
read it; otherwise skip it.

### 6. Repo-wide gotchas
```bash
rg -c 'TODO|FIXME|HACK|XXX' -g '!node_modules' | sort -t: -k2 -rn | head -10
```
Record clusters, legacy directories, generated code that must not be hand-edited,
and dual patterns (e.g. two HTTP clients) — anything that would mislead a newcomer.

---

## Cache file

Write to `.agents/context/repo-map.md`. Create `.agents/context/` if absent.

````markdown
---
type: repo-map
generated_at: <ISO 8601 UTC>
git_sha: <git rev-parse HEAD at write time>
git_branch: <branch at write time>
ttl_days: 14
sources:
  - package.json
  - tsconfig.json
  - <every anchor and sampled file actually read>
---

# Repo Map — <repo name>

## Runtime & Build
- Runtime: <e.g. Node 20 via .nvmrc>
- Package manager / build: <...>
- Layout: <single package | workspaces: list>
- Path aliases: <...>

## Frameworks
- `<name>` — <role> — evidence: `<manifest>` (`<dependency or field>`)
- `unlisted — <package> — <manifest>`
- `n/a — searched <manifest paths>`

## Entry Points
- `<path>` — <what it starts / serves>
- entry-point patterns: <catalog patterns applied, or `none applied`>

## Conventions
- Naming: ...
- Imports: ...
- Error handling: ...
- Logging: ...
- Tests: ...

## Hotspots (90 days)
- `<path>` — <n> changes

## Gotchas
- <legacy pattern, FIXME cluster, generated dir, dual pattern>
````

Write `n/a — <what you searched>` for a section that genuinely has nothing; never
omit a section. Cite a sampled `file:line` for each convention you infer from code.
The Frameworks bullets are line shapes: one bullet per match or `unlisted`
package, and the `n/a — searched` bullet only when both of those are empty.
Every framework config file used as evidence is listed under `sources:`.

After writing, re-read the file and confirm `git_sha` matches HEAD and every
`sources:` entry exists.

---

## Return

```
cache: <fresh | rebuilt> · <path> · git_sha <short sha>

<the cache body, minus frontmatter>
```
