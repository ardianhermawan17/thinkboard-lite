# CLAUDE.md — thinkboard-lite-architecture

Plan-and-process repo for ThinkBoard Lite. No product code lives here. App work happens in
`frontend-thinkboard-lite/`, which has its own `CLAUDE.md`. Doc map: `README.md`.

## Session start — in this order

1. Read `agent-history/running-process.json` — the resumption pointer (`02-working.md` §0.3).
2. Read `README.md` for the doc map and where things stand.
3. Find the task in `07-whole-apps-task.md`; for task 000 read `todo-task-000-split.md`.

## Process law (`02-working.md`, `04-TODO.md`, `05-agent-limitation.md`)

- No code before the task has `task.json` **and** a completed `analyze.json`. `analyze.json.sources_read`
  is the read step — cite doc **and** section.
- Intake before execution: a human ask becomes `agent-thinking/todo/NNN-todo-<slug>/contract.json` + a
  `tracking-todo.json` entry; picking it up opens `agent-history/NNN-task-<slug>/` and a
  `running-process.json.task_sequence` row.
- `validate.json.goal_checks` has one entry per goal id. No exceptions.
- Anything touching RLS or pipeline-stage transitions cannot reach validate with `test.json.summary.total: 0`.
- Nothing in `agent-history/` is ever deleted; cancelled tasks keep their folder.
- Every JSON file stays parseable: no comments, no trailing commas.

## Task ids — read before opening any folder

`NNN` is global and never reused. `agent-history/` already holds **001–010** (Full's Go backend; 006 twice).
The Lite plan's 001–024 therefore **cannot** be used as folder ids. The remap is escalated as **C7** in
`todo-task-000-split.md` §3 — recommended default: plan id + 10. **Until a human answers, only
`000-task-architecture-contract` may open a folder.**

## When docs disagree

Use the precedence table in `todo-task-000-split.md` §3.0. If it does not settle the fact, or the winner
is demonstrably wrong: **stop, record an `open_questions` / `openQuestions[]` entry, and ask. Never pick.**
Every D-, Q- and DB-Q- item a task touches goes into its `analyze.json.open_questions`; the registry is
§4.1 of the split. A default a doc author took is `defaulted`, never `confirmed`.

## Git — hard limits (`05-agent-limitation.md`)

- **Every** git write (`commit`, `push`, `merge`, `pull --rebase`, branch delete, `gh pr create`) needs an
  explicit yes from the user, every time. Read-only git needs nothing.
- Writes land on the session's shadow branch only — never on `master`, not even a fast-forward.
- `frontend-thinkboard-lite/` is a separate repo with its own `.git`; the same rules apply there.

## "Human Mode"

A prompt flagged "Human Mode" means: read `README.md`, ask clarifying questions, write the todo contract,
track in `agent-history/`, then implement and validate (`05-agent-limitation.md` §3).

## Facts that are easy to get wrong

- **Schema**: implement `07-database-architecture.md` §8.1, not `06-thinkboard-lite.md` §6 (superseded).
- **No service-role key in Lite** (RULE-01 / DB-1). RLS *is* the authorization layer.
- **Supabase key names**: `anon` / `service_role` are deprecated by end-2026 in favour of publishable
  (`sb_publishable_…`) and secret (`sb_secret_…`) keys. `0003_grant_schema.sql` and older docs still use
  the old names — use the new ones in anything you write.
- **State library** is Redux Toolkit (+ RTK Query for the four commands only), not TanStack Query or
  Zustand — conflict C8.
- **Handwriting** is a plain `<textarea>` the OS writes into; the ink pad is a conditional fallback (v2 §3).
- `claude-artifact/` and `old/` are archived snapshots — read if useful, never edit, never cite as normative.
