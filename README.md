# ThinkBoard Lite — architecture

A shared PDF workspace where every highlight is a focus point, every focus point carries notes (typed or
handwritten), and the workspace produces two LLM-written conclusions — a private one per member and a
curated one for the team — collaborative by default and still working with the network off.

This repository is the **plan and the process**, not the product. The app lives in
[`frontend-thinkboard-lite/`](frontend-thinkboard-lite/README.md) (its own git repo). The Supabase project
(`0001`–`0003` migrations) lives in `thinkboard-supabase/`, outside this repo.

## Where things stand — 2026-09-18

| | |
|---|---|
| Target plan | [`07-whole-apps-task.md`](07-whole-apps-task.md) — 25 tasks, phases A–F, confirmed by the owner as the backlog |
| Next task | `000-task-architecture-contract`, split into five packages in [`todo-task-000-split.md`](todo-task-000-split.md) |
| Database | defined in [`07-database-architecture.md`](07-database-architecture.md) rev 1.1 — §8.1 is the final `0004_lite.sql` |
| Frontend | scaffolded (Next 16.3.4 + shadcn), **not yet in the folder-law shape** — task 004 conforms it |
| Blocked on a human | **C7** — plan ids 001–024 collide with `agent-history/` 001–010 · **C6** — sign-off on the 3-value enum · **D-12, Q7** |

`agent-history/` 001–010 are Full's Go-gateway tasks (`thinkboard-backend/`), done before the Lite pivot.
Lite has no Go gateway; its four endpoints are Next.js route handlers.

## Read in this order

| # | Doc | What it is | Authority |
|---|---|---|---|
| 1 | [`06-thinkboard-lite.md`](06-thinkboard-lite.md) | the consolidated Lite spec: loop, RULE-01…25, mechanisms, decisions D-01…12 | Lite product intent |
| 2 | [`07-whole-apps-task.md`](07-whole-apps-task.md) | **the goal** — every task as main-goal + mini-goals, dependency graph, LLM-routing decision | the backlog |
| 3 | [`07-database-architecture.md`](07-database-architecture.md) | scope map, ERDs, frontend data contract, Dexie mirror, final SQL, review | schema, RLS, Dexie |
| 4 | [`frontend-folder-architecture.md`](frontend-folder-architecture.md) | folders, aliases, leaves, placement tree, invariants I1–I25 | frontend structure |
| 5 | [`frontend-architecture.md`](frontend-architecture.md) | why the frontend diverges: Dexie, commands-only RTK Query, painters, 4-point store edit | frontend mechanism |
| 6 | [`01-thinkboard-lite-frontend-v2.md`](01-thinkboard-lite-frontend-v2.md) | Dexie ⇄ Supabase sync channels; handwriting = a plain `<textarea>`; I26–I28 | amends 5 |
| 7 | [`todo-task-000-split.md`](todo-task-000-split.md) | task 000 as five packages; precedence table, conflicts C1–C9, invariant + decision registries | task 000 only |
| — | [`02-working.md`](02-working.md) · [`04-TODO.md`](04-TODO.md) · [`05-agent-limitation.md`](05-agent-limitation.md) | agent process: phases and JSON contracts, todo intake, git limits | process — always wins |

Superseded or explanatory, never normative: `00-thinkboard-lite-abstract-plan.md` (replaced by 06), the
`*.html` companions (visual walkthroughs of 06, the frontend docs and v2), `claude-artifact/` and `old/`
(archived snapshots, git-ignored). When two docs disagree, `todo-task-000-split.md` §3.0 says who wins.

## Repository layout

```
agent-history/        execution record — one NNN-task-<slug>/ per task + running-process.json (02-working.md)
agent-thinking/       intake — todo/NNN-todo-<slug>/contract.json + tracking-todo.json (04-TODO.md)
frontend-thinkboard-lite/   the Next.js app (own git repo)
*.md                  the plan docs above
*.html                visual companions
claude-artifact/ old/ archived copies — do not edit
```

## The plan in one picture

```
A Architecture   000                  B Data contract  001 002 003     C Foundation  004 005 006 007
D Features       008 … 016            E Backend        017 … 021       F Hardening   022 023 (024)

Critical path:   000 → 001 → 004 → 006 → 008 → 009 → 010 → 012
                 = the demoable slice: highlight, handwrite, sync — no backend, no model calls
```

Working with an agent in this repo: see [`CLAUDE.md`](CLAUDE.md).
