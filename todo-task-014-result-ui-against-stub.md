---
doc_id: thinkboard-lite-task-014
title: Task 014 — Result UI against a stub
version: "1.0"
status: proposed
updated: 2026-09-18
task: "014"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 014 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 014 — Result UI against a stub

`014-task-result-ui-against-stub` · `frontend` (secondary `backend`) · phase D — Frontend features · depends on [`013`](todo-task-013-sheets-and-promotion.md) · blocks [`020`](todo-task-020-result-engine.md)

**Main goal —** The result experience is complete and reviewable before any model call exists.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 014 only. |
| **Do not** | Add a fifth endpoint. Return rows from a command. |

---

## 1. What can go wrong

- Reading the mutation response instead of Dexie makes 020's swap a frontend change — the thing this task exists to prevent.
- A group run by a member is an RLS denial (DB-F7): the stub must respect it.

---

## 2. Goals and gate

- `g1` Command hooks for mini-conclusion and generate-result, pointed at a stubbed route that writes canned rows. *(tasks 014 g1; fa §4.3)*
- `g2` Result reads come from Dexie runs, fetched when a pipeline_runs broadcast reaches a terminal status; the mutation returns an id or status only. *(tasks 014 g2; db §6.1; fa I14)*
- `g3` Descriptive markdown rendering; mermaid-figure template for visualize mode. *(tasks 014 g3; fa §8)*
- `g4` Temperature chips with the rule-based formula and a one-line tooltip explaining the score. *(tasks 014 g4; spec §5.5)*
- `g5` States: empty, running, queued (quota), failed, done. *(tasks 014 g5)*

**Gate —** The full result flow is demoable with the server stubbed. Proves phases C–D do not depend on E.
**Blocks —** [`020`](todo-task-020-result-engine.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q2 | defaulted | RTK Query for the four commands only | createApi covers the four commands only (I15) |
| D-03 | defaulted | group result is leader-only | group run button leader-only |

---

## 4. Where the work lands

```
src/features/result/api/result-api/
src/features/result/components/
src/shared/components/template/mermaid-figure/
src/app/api/v1/…/route.ts (stub)
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- I14 / I15
- each of the five states
- terminal-status fetch into Dexie

---

## 6. Hand-offs

- 020 replaces the stub with no frontend change

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/014-task-result-ui-against-stub/task.json`

```json
{
  "id": "014-task-result-ui-against-stub",
  "title": "The result experience is complete and reviewable before any model call exists",
  "architecture": "frontend",
  "secondary_architecture": ["backend"],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["013-task-sheets-and-promotion"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 014"},
    {"doc": "03-frontend-architecture.md", "section": "§4.3"},
    {"doc": "02-database-architecture.md", "section": "§5, §6.1"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5"},
    {"doc": "todo-task-014-result-ui-against-stub.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Command hooks for mini-conclusion and generate-result, pointed at a stubbed route that writes canned rows", "plan_ref": "tasks 014 g1; fa §4.3", "status": "pending"},
    {"id": "g2", "description": "Result reads come from Dexie runs, fetched when a pipeline_runs broadcast reaches a terminal status; the mutation returns an id or status only", "plan_ref": "tasks 014 g2; db §6.1; fa I14", "status": "pending"},
    {"id": "g3", "description": "Descriptive markdown rendering; mermaid-figure template for visualize mode", "plan_ref": "tasks 014 g3; fa §8", "status": "pending"},
    {"id": "g4", "description": "Temperature chips with the rule-based formula and a one-line tooltip explaining the score", "plan_ref": "tasks 014 g4; spec §5.5", "status": "pending"},
    {"id": "g5", "description": "States: empty, running, queued (quota), failed, done", "plan_ref": "tasks 014 g5", "status": "pending"}
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
  "task_id": "014-task-result-ui-against-stub",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 014"},
    {"doc": "03-frontend-architecture.md", "section": "§4.3"},
    {"doc": "02-database-architecture.md", "section": "§5, §6.1"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5"},
    {"doc": "todo-task-014-result-ui-against-stub.md", "section": "full file"}
  ],
  "scope": "Result UI, command hooks, rendering, temperature chips, states — against a stub. Out of scope: Add a fifth endpoint. Return rows from a command.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "The stub writes pipeline_runs / points / renderings under the user's JWT."},
    {"goal_id": "g2", "text": "No container destructures data from a command hook."},
    {"goal_id": "g3", "text": "Both renderings display from the stub rows."},
    {"goal_id": "g4", "text": "The tooltip names the factors."},
    {"goal_id": "g5", "text": "Each state has a story."}
  ],
  "open_questions": ["Q2 (defaulted: RTK Query for the four commands only) — createApi covers the four commands only (I15).", "D-03 (defaulted: group result is leader-only) — group run button leader-only."],
  "risks": ["Reading the mutation response instead of Dexie makes 020's swap a frontend change — the thing this task exists to prevent.", "A group run by a member is an RLS denial (DB-F7): the stub must respect it."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "014-task-result-ui-against-stub",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 014", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§4.3", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§5, §6.1", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/014-todo-result-ui-against-stub/contract.json`:

```json
{
  "id": "014-todo-result-ui-against-stub",
  "name": "Result UI against a stub",
  "goal": "The result experience is complete and reviewable before any model call exists.",
  "todo_path": "agent-thinking/todo/014-todo-result-ui-against-stub/contract.json",
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

`06-whole-apps-task.md` PHASE D · 014, `03-frontend-architecture.md` §4.3, `02-database-architecture.md` §5, §6.1, `01-thinkboard-lite-spec.md` §5.5. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
