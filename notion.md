# ThinkBoard Lite — Work log and historical reference

Period: 2026-09 (repo history through commit `c67991b`, 2026-09-19, plus uncommitted work on task 003) · Repo: `ardianhermawan17/thinkboard-lite` · Local: `thinkboard-lite-architecture`

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
| (uncommitted, 2026-09-19) | Task 003 partial: migration `0005`, seed, `db:seed`; g1 and g3 blocked |

## Completed tasks

### 000 — Architecture contract (18/18 goals, closed 2026-09-18)
Split into five packages (A–E) inside one task folder, replacing a gate a stub could pass. Delivered `architecture.blueprint.json` + schema, `verify-architecture.mjs` with fixtures and tests, `eslint.architecture.mjs` with tests, `AGENTS.md`, `CLAUDE.md`, frontend README. Resolved plan-vs-repo conflicts C1–C9 and gap G1; C7 resolved by owner (plan id = folder id).

### 001 — Supabase Lite migration (7/7 goals, closed 2026-09-18)
Migrations `0001_initial`, `0002_auth_trigger`, `0003_grant_schema`, `0004_lite`, plus `config.toml`; documented in `02-database-architecture.md` §8.1.

### 002 — RLS access proof (16/16 goals, closed 2026-09-18)
`supabase/tests/rls.sql` and `rls.test.mjs` run against the local stack. DB-1 makes RLS the authorization layer, so this is the proof, not a safety net.

### 003 — Types and seed (partial: 3/5 goals, task `blocked`, 2026-09-19)
Done: g2 (seed: one team, leader + two members, board/column/session, one PDF artifact), g4 (private `artifacts` bucket + policy in the new migration `0005_storage_artifacts.sql`; a generated placeholder PDF uploaded as the seeded leader), g5 (`npm run db:seed`, fresh stack to seeded state in about 50 s, idempotent). Tests: `test:seed` 6/6, task 002's suite still 17/17 (56 checks), storage read policy mutation-tested. Blocked: g1 (generated types) on 004's `src/`; g3 (provider rows) on D-12.

## Key decisions

- **Schema before frontend.** Phase B (Supabase) precedes Phase C so the frontend never builds against mocks.
- **RLS is the authorization layer** (DB-1); `team_members` is client read-only, so member adds need a definer RPC (raised for task 008).
- **LLM routing:** do not embed OmniRoute (wrong shape for a server-side multi-user adapter, compliance exposure from cookie-based providers, operational weight). Keep the specified adapter; OpenRouter provider #1, Groq #2, user key via Vault #3; failover in `ratelimit.ts`. OmniRoute is fine for the dev loop only.
- **Plan id = folder id** for tasks 000–024 (C7).
- **Storage policy lives in a migration, not the seed** (2026-09-19, owner-approved): `0005_storage_artifacts.sql` ships with the schema; `0004` stays frozen. The bucket is private; read = session member, write = leader.
- **The seed PDF upload runs as the seeded leader**, so RLS authorises it and no secret key is needed (RULE-01). The PDF is generated, never real (Perhutani) content.
- **003 order** (2026-09-19, owner): 003 partial first, then 004; g3 held on D-12 (no placeholder provider rows).
- **Empty `src/` is a fail**, never a pass (package D g11), because a stub analyzer must not go green.
- **Agent process:** gate 0–5 (orient → intake → ready → open → work → close); five phase files per task (analyze, code, test, validate, result), tracked in `running-process.json` and `tracking-todo.json`.

## Lessons / gotchas

- The Lite `start` script excluded storage-api, so a storage goal needs the stack restarted with it enabled; check the stack config before planning a storage task.
- Editing JSON with PowerShell 5.1 `Get-Content` / `Set-Content` corrupts UTF-8 (`§` becomes `Â§`); use `[IO.File]::ReadAllText/WriteAllText` with UTF-8.
- A guard hook that blocks the first write to a file can leave a multi-file state update half-applied; re-check every file after a batch.
- A verification gate satisfiable by a no-op is worthless; make emptiness a failure.
- `create-next-app` had already run ahead of plan, so task 004 conforms the scaffold instead of creating one.
- ESLint 10 / `eslint-config-next` incompatibility blocks `npm run lint` until task 004.
- Free-tier LLM providers may train on prompts; D-12 must be answered before 018.

## Open follow-ups carried forward

D-12 (gates 018 and 003 g3); C6 sign-off; gitlink for `frontend-thinkboard-lite`; example-folder numbering; add-member RPC in 008; 003 g1 (generated types) waits on 004's `src/`; nothing from task 003 is committed yet.

## Where things live

`01-thinkboard-lite-spec.md` (product) · `02-database-architecture.md` · `03/04/05` frontend architecture, folders, sync/handwriting · `06-whole-apps-task.md` (25-task plan) · `07/08/09` agent process, intake, limits · `todo-task-NNN-*.md` (plan docs) · `agent-history/` (per-task phase JSON) · `agent-thinking/` (contracts).

See `clickup.md` for the live board (done / ongoing / to do).
