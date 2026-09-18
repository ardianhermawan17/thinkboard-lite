---
doc_id: thinkboard-lite-task-017
title: Task 017 — Command endpoints
version: "1.0"
status: proposed
updated: 2026-09-18
task: "017"
phase: "E — Backend"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 017 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 017 — Command endpoints

`017-task-command-endpoints` · `backend` · phase E — Backend · depends on [`001`](todo-task-001-supabase-lite-migration.md) · blocks [`018`](todo-task-018-llm-adapter.md)

**Main goal —** The four server endpoints exist with real auth and no business logic in the route layer.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | `depends_on: 001` is derived, not stated in the plan: g5 needs `can_lead_session()` and the run-cluster policies from 001. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 017 only. |
| **Do not** | Add a fifth endpoint. Resolve a key outside llm/. Use a secret key. |

---

## 1. What can go wrong

- POST /workspaces duplicating logic 008 already runs through create_workspace — wrap the RPC, do not reimplement it.
- Compression on the SSE route breaks streaming (spec §4.3).

---

## 2. Goals and gate

- `g1` POST /api/v1/workspaces, POST /api/v1/highlights/:id/mini-conclusion, POST /api/v1/workspaces/:id/results, GET /api/v1/runs/:id/stream. *(tasks 017 g1; spec §4.3)*
- `g2` Handlers bind, call one service method, map the error; no if on domain state. *(tasks 017 g2; spec RULE-22)*
- `g3` src/server/ mirrors the future Go packages: pipeline/, pipeline/stages/registry.ts, llm/, memory/, db/. *(tasks 017 g3; spec §4.2)*
- `g4` Every request runs under the user's JWT; no service-role or secret key anywhere. *(tasks 017 g4; spec RULE-01)*
- `g5` Group-result requests return 403 unless can_lead_session(); RLS enforces the same (D-03). *(tasks 017 g5; db §8.1)*

**Gate —** Every endpoint traces to a `blueprint.commands[]` entry; there is no fifth.
**Blocks —** [`018`](todo-task-018-llm-adapter.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-03 | defaulted | group result is leader-only | g5 |
| DB-Q6 | defaulted | `create_workspace` definer RPC; creator is leader | POST /workspaces wraps create_workspace |
| RULE-23 | standing rule (spec §3) | — | check RLS reachability before adding anything |

---

## 4. Where the work lands

```
src/app/api/v1/**/route.ts
src/server/{pipeline,llm,memory,db}/
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- 403 for member group run
- blueprint trace (I15)
- handler has no domain branch

---

## 6. Hand-offs

- 018 fills llm/
- 020 fills pipeline/

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/017-task-command-endpoints/task.json`

```json
{
  "id": "017-task-command-endpoints",
  "title": "The four server endpoints exist with real auth and no business logic in the route layer",
  "architecture": "backend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["001-task-supabase-lite-migration"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 017"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§4, RULE-01, RULE-21..24"},
    {"doc": "02-database-architecture.md", "section": "§8.1"},
    {"doc": "todo-task-017-command-endpoints.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "POST /api/v1/workspaces, POST /api/v1/highlights/:id/mini-conclusion, POST /api/v1/workspaces/:id/results, GET /api/v1/runs/:id/stream", "plan_ref": "tasks 017 g1; spec §4.3", "status": "pending"},
    {"id": "g2", "description": "Handlers bind, call one service method, map the error; no if on domain state", "plan_ref": "tasks 017 g2; spec RULE-22", "status": "pending"},
    {"id": "g3", "description": "src/server/ mirrors the future Go packages: pipeline/, pipeline/stages/registry.ts, llm/, memory/, db/", "plan_ref": "tasks 017 g3; spec §4.2", "status": "pending"},
    {"id": "g4", "description": "Every request runs under the user's JWT; no service-role or secret key anywhere", "plan_ref": "tasks 017 g4; spec RULE-01", "status": "pending"},
    {"id": "g5", "description": "Group-result requests return 403 unless can_lead_session(); RLS enforces the same (D-03)", "plan_ref": "tasks 017 g5; db §8.1", "status": "pending"}
  ],
  "phases": {
    "analyze": {"file": "analyze.json", "status": "not_started"},
    "code": {"file": "code.json", "status": "not_started"},
    "test": {"file": "test.json", "status": "not_started"},
    "validate": {"file": "validate.json", "status": "not_started"},
    "result": {"file": "result.json", "status": "not_started"}
  }
}
```

### 7.2 `analyze.json` — the shape to fill

```json
{
  "task_id": "017-task-command-endpoints",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 017"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§4, RULE-01, RULE-21..24"},
    {"doc": "02-database-architecture.md", "section": "§8.1"},
    {"doc": "todo-task-017-command-endpoints.md", "section": "full file"}
  ],
  "scope": "The four route handlers and the src/server skeleton. Out of scope: Add a fifth endpoint. Resolve a key outside llm/. Use a secret key.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Exactly four route files."},
    {"goal_id": "g2", "text": "No handler imports a domain rule."},
    {"goal_id": "g3", "text": "Folder names match spec §4.2."},
    {"goal_id": "g4", "text": "A grep for secret keys finds none."},
    {"goal_id": "g5", "text": "Member → 403; leader → accepted."}
  ],
  "open_questions": ["D-03 (defaulted: group result is leader-only) — g5.", "DB-Q6 (defaulted: `create_workspace` definer RPC; creator is leader) — POST /workspaces wraps create_workspace.", "RULE-23 — check RLS reachability before adding anything."],
  "risks": ["POST /workspaces duplicating logic 008 already runs through create_workspace — wrap the RPC, do not reimplement it.", "Compression on the SSE route breaks streaming (spec §4.3)."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "017-task-command-endpoints",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 017", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§4, RULE-01, RULE-21..24", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§8.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/017-todo-command-endpoints/contract.json`:

```json
{
  "id": "017-todo-command-endpoints",
  "name": "Command endpoints",
  "goal": "The four server endpoints exist with real auth and no business logic in the route layer.",
  "todo_path": "agent-thinking/todo/017-todo-command-endpoints/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **5 here** · anything
touching RLS or stage transitions cannot reach validate with `test.json.summary.total: 0` · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every
time** (`09-agent-limitation.md` §1), on the shadow branch, never `master` · `npm run verify` green before a
frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE E · 017, `01-thinkboard-lite-spec.md` §4, RULE-01, RULE-21..24, `02-database-architecture.md` §8.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
