# ThinkBoard Lite — Work log and historical reference

Period: 2026-09 (repo history through merge `1be047f` (PR #5), 2026-09-19, plus task 004, committed on `claude/task-004` (`8a41428`), and the task 003 follow-up on `claude/task-003b`, not yet committed) · Repo: `ardianhermawan17/thinkboard-lite` · Local: `thinkboard-lite-architecture`

## What ThinkBoard Lite is

A shared PDF workspace: every highlight is a focus point, every focus point carries notes (typed or handwritten), and each workspace produces an individual and a group conclusion via a free-tier LLM. Collaborative by default, still working offline. Stack: Next.js, Konva, Tailwind + shadcn, Motion, Mermaid, Supabase (Postgres + RLS + Realtime), Dexie for local-first.

This repo is the plan and the process; the app lives in `frontend-thinkboard-lite/`, the database in `database-thinkboard-lite/`.

## Timeline

| Commit | What happened |
|---|---|
| `955c310` | ThinkBoard Lite plan and process baseline |
| `0ef72be` | Defined the Lite database, finished the task-000 split, added README and CLAUDE.md |
| `56066a5`, `b1573bc` | Notes tidy-up; task-000 split and DB review (PR #1) |
| `987d4e2` | Tasks 000 and 001: architecture contract and the Supabase Lite migration (PR #2) |
| `c67991b` | Task 002: RLS access model proven against the local Supabase stack |
| `3f9086f` (PR #4) | Task 003 partial: migration `0005`, seed, `db:seed`; g1 and g3 blocked |
| `95c470e` (PR #5) | The gate workflow and ClickUp/Notion sync diagram, `gate-workflow.html` |
| `8a41428` (`claude/task-004`) | Task 004: the scaffold conformed to the folder law; `npm run verify` green |
| (uncommitted, `claude/task-003b`) | Task 003 finished: generated domain types and placeholder provider rows |

## Completed tasks

### 000 — Architecture contract (18/18 goals, closed 2026-09-18)
Split into five packages (A–E) inside one task folder, replacing a gate a stub could pass. Delivered `architecture.blueprint.json` + schema, `verify-architecture.mjs` with fixtures and tests, `eslint.architecture.mjs` with tests, `AGENTS.md`, `CLAUDE.md`, frontend README. Resolved plan-vs-repo conflicts C1–C9 and gap G1; C7 resolved by owner (plan id = folder id).

### 001 — Supabase Lite migration (7/7 goals, closed 2026-09-18)
Migrations `0001_initial`, `0002_auth_trigger`, `0003_grant_schema`, `0004_lite`, plus `config.toml`; documented in `02-database-architecture.md` §8.1.

### 002 — RLS access proof (16/16 goals, closed 2026-09-18)
`supabase/tests/rls.sql` and `rls.test.mjs` run against the local stack. DB-1 makes RLS the authorization layer, so this is the proof, not a safety net.

### 003 — Types and seed (5/5 goals, closed 2026-09-19 in two rounds)
Done: g2 (seed: one team, leader + two members, board/column/session, one PDF artifact), g4 (private `artifacts` bucket + policy in the new migration `0005_storage_artifacts.sql`; a generated placeholder PDF uploaded as the seeded leader), g5 (`npm run db:seed`, fresh stack to seeded state in about 50 s, idempotent). Tests: `test:seed` 6/6, task 002's suite still 17/17 (56 checks), storage read policy mutation-tested. Round 2 (branch `claude/task-003b`): g1 generated domain types (`npm run gen:types`: 25 files plus a hand-written `common.ts`, ids and timestamps branded, I9 green) and g3 **placeholder** `llm_providers` / `llm_models` rows (inactive, `placeholder.invalid`, "D-12 pending", no key, no real provider named). **D-12 is still unanswered**; the placeholders decide nothing and task 018 stays gated on it.

### 004 — Conform the frontend scaffold (6/6 goals, closed 2026-09-19)
The create-next-app scaffold moved under `src/{app,features,shared}` with the four aliases (`@app @feature @shared @public`) declared in both `tsconfig.json` and `vitest.config.mts`; the architecture lint rules are spread into ESLint; Vitest runs two projects (jsdom + fake-indexeddb unit tests, and Storybook story tests in headless Chrome via Playwright); Serwist (`@serwist/next`) is configured and a production build registers the worker. Gate: `npm run verify` green on the real tree (verify:arch 18/0, lint, typecheck, tests); verify:arch exits 1 without `src/`. Unblocks 003 g1, 005 and 006.

## Key decisions

- **Schema before frontend.** Phase B (Supabase) precedes Phase C so the frontend never builds against mocks.
- **RLS is the authorization layer** (DB-1); `team_members` is client read-only, so member adds need a definer RPC (raised for task 008).
- **LLM routing:** do not embed OmniRoute (wrong shape for a server-side multi-user adapter, compliance exposure from cookie-based providers, operational weight). Keep the specified adapter; OpenRouter provider #1, Groq #2, user key via Vault #3; failover in `ratelimit.ts`. OmniRoute is fine for the dev loop only.
- **Plan id = folder id** for tasks 000–024 (C7).
- **Storage policy lives in a migration, not the seed** (2026-09-19, owner-approved): `0005_storage_artifacts.sql` ships with the schema; `0004` stays frozen. The bucket is private; read = session member, write = leader.
- **The seed PDF upload runs as the seeded leader**, so RLS authorises it and no secret key is needed (RULE-01). The PDF is generated, never real (Perhutani) content.
- **003 order** (2026-09-19, owner): 003 partial first, then 004; g3 held on D-12 (no placeholder provider rows).
- **Placeholders are not a decision** (2026-09-19, owner): 003's g3 provider rows name no real provider, are inactive and hold no key. Only a human answer makes D-12 `confirmed`; a ruling that placeholders are acceptable does not.
- **Domain types are generated, not written**: `npm run gen:types` reads `supabase gen types` and writes one file per non-parked blueprint table; `common.ts` (the brands) is the only hand-written file in `domain/`.
- **`next build --webpack`** (2026-09-19): Serwist is a webpack plugin and Next 16 builds with Turbopack by default, which would silently generate no service worker. Dev stays on Turbopack with Serwist disabled; only a production build generates and registers the worker.
- **ESLint 9, Vitest 4** (owner / dependency fit): ESLint 10 broke `eslint-config-next`; Vitest 5 needs a newer `@types/node` than the scaffold's `^20`. Revisit both when the Node types are bumped.
- **The story test runs inside `npm run test` and `verify`** (owner choice); no standalone `playwright.config.ts` until a task needs end-to-end tests. It uses the installed Chrome.
- **The config-protection hook is respected**: two edits to `eslint.config.mjs` (architecture spread, generated-worker ignore) were each explicitly authorised by the owner before being applied.
- **Empty `src/` is a fail**, never a pass (package D g11), because a stub analyzer must not go green.
- **Agent process:** gate 0–5 (orient → intake → ready → open → work → close); five phase files per task (analyze, code, test, validate, result), tracked in `running-process.json` and `tracking-todo.json`.

## Lessons / gotchas

- Read generated output, not only its tests: `supabase gen types` repeats `Enums` as arrays in a trailing `Constants` block at the same indentation; a parser that re-entered it produced invalid TypeScript, and the trimmed test fixture had hidden it. Make fixtures mirror the real output.
- A daily MCP limit (ClickUp: 100 calls) can stop a sync mid-task: batch the calls, and when it hits, record the pending sync in `clickup.md` instead of claiming success.
- A verifier that strips comments with a regex must be string-aware: the `/*` in `"@app/*"` opened a "comment" closed by the `*/` of a later `"**/*.ts"`, so task 000's verifier crashed on every real `tsconfig`. Its fixtures never covered a globbed `include`.
- A dev-tool package can bring high-severity advisories in a build-time dependency (`@serwist/next` pins `browserslist` 4.28.6): run `npm audit` after every install and fix with a scoped `overrides` entry.
- In PowerShell, `rd` is an alias of `Remove-Item` and aliases beat functions: a helper named `Rd` deleted two tracked files. Never name helpers after aliases; git restored them.
- Generated build output (`public/sw.js`) must be ignored by both git and ESLint, or `verify` fails only after a build.
- The Lite `start` script excluded storage-api, so a storage goal needs the stack restarted with it enabled; check the stack config before planning a storage task.
- Editing JSON with PowerShell 5.1 `Get-Content` / `Set-Content` corrupts UTF-8 (`§` becomes `Â§`); use `[IO.File]::ReadAllText/WriteAllText` with UTF-8.
- A guard hook that blocks the first write to a file can leave a multi-file state update half-applied; re-check every file after a batch.
- A verification gate satisfiable by a no-op is worthless; make emptiness a failure.
- `create-next-app` had already run ahead of plan, so task 004 conforms the scaffold instead of creating one.
- ESLint 10 / `eslint-config-next` incompatibility blocks `npm run lint` until task 004.
- Free-tier LLM providers may train on prompts; D-12 must be answered before 018.

## Open follow-ups carried forward

D-12 (gates 018); C6 sign-off; gitlink for `frontend-thinkboard-lite`; example-folder numbering; add-member RPC in 008; D-12 is still open for task 018 (003's placeholder provider rows stand in); ClickUp shows 003 as `in progress` until its daily MCP limit resets (see `clickup.md`); the task 003 follow-up (`claude/task-003b`) is not committed yet; rerun `npm run gen:types` after any migration; drop the `browserslist` override when `@serwist/next` patches its pin; two lint warnings remain.

## Where things live

`01-thinkboard-lite-spec.md` (product) · `02-database-architecture.md` · `03/04/05` frontend architecture, folders, sync/handwriting · `06-whole-apps-task.md` (25-task plan) · `07/08/09` agent process, intake, limits · `todo-task-NNN-*.md` (plan docs) · `agent-history/` (per-task phase JSON) · `agent-thinking/` (contracts).

See `clickup.md` for the live board (done / ongoing / to do).
