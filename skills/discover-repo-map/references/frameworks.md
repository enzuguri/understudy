# Framework catalog

Match these rows against the manifests read in step 2 of `discover-repo-map`. A row applies only when its manifest signal is present. The confirm pattern supports that hit and is the entry-point search to run for it. A confirm pattern is not a match on its own.

| Framework | Role | Manifest signal | Confirm / entry-point pattern |
| --- | --- | --- | --- |
| Next.js | app | `next` in `dependencies` or `devDependencies` | `app/` or `pages/` |
| Express | HTTP | `express` in `dependencies` | router registration (`$APP.use($$$)`, `$ROUTER.$METHOD($$$)`) |
| Fastify | HTTP | `fastify` in `dependencies` | router registration (`$APP.use($$$)`, `$ROUTER.$METHOD($$$)`) |
| tRPC | RPC | `@trpc/server` in `dependencies` | `router(` |
| CLI | CLI | `bin` in `package.json`, or `[project.scripts]` | `bin/` |

## Unlisted

A dependency you recognize as an application, HTTP, RPC, or CLI framework, and that has no row in this table, is `unlisted`. Record the package name and the manifest. Leave its entry-point pattern unset.

## No match

When no row matches and no dependency is unlisted, the Frameworks section is `n/a — searched <manifest paths>`.
