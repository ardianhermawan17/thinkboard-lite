---
doc_id: thinkboard-lite-task-019
title: Task 019 — Mini-conclusion
version: "1.0"
status: proposed
updated: 2026-09-18
task: "019"
phase: "E — Backend"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 019 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 019 — Mini-conclusion

`019-task-mini-conclusion` · `backend` · phase E — Backend · depends on [`018`](todo-task-018-llm-adapter.md) · blocks [`020`](todo-task-020-result-engine.md)

**Main goal —** Each focus point gets a cheap conclusion that respects the free-tier budget.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 019 only. |
| **Do not** | Call a model per note. Return the conclusion from the endpoint. |

---

## 1. What can go wrong

- Any member can overwrite a shared highlight's mini-conclusion today (DB-Q8).

---

## 2. Goals and gate

- `g1` Debounce 3 s after a highlight or note change; idempotent per cache key. *(tasks 019 g1)*
- `g2` Prompt: goal → persona → highlight text → attached notes → output contract. *(tasks 019 g2; spec §5.5)*
- `g3` Write mini_conclusions; the client picks it up through the broadcast like any other row. *(tasks 019 g3; db §8.1 DB-F5)*
- `g4` Skip needs-correction highlights below the OCR gate. *(tasks 019 g4)*
- `g5` Budget check: a 40-highlight workspace costs ≈42 calls, not 40 × 7. *(tasks 019 g5; spec §7)*

**Gate —** 40 highlights processed inside one day's free-tier quota, measured from `llm_requests`.
**Blocks —** [`020`](todo-task-020-result-engine.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| DB-Q8 | defaulted | `mini_conclusions` write scope as written | who may write mini_conclusions |
| D-12 | **unanswered** | — | inherited through 018 |

---

## 4. Where the work lands

```
src/server/pipeline/ (mini-conclusion service)
src/app/api/v1/highlights/[id]/mini-conclusion/route.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- debounce + idempotency
- needs-correction skip
- call budget

---

## 6. Hand-offs

- 020 batches all mini-conclusions into one prompt

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/019-task-mini-conclusion/task.json`

```json
{
  "id": "019-task-mini-conclusion",
  "title": "Each focus point gets a cheap conclusion that respects the free-tier budget",
  "architecture": "backend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["018-task-llm-adapter"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 019"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5, §7"},
    {"doc": "02-database-architecture.md", "section": "§8.1, §10 DB-Q8"},
    {"doc": "todo-task-019-mini-conclusion.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Debounce 3 s after a highlight or note change; idempotent per cache key", "plan_ref": "tasks 019 g1", "status": "pending"},
    {"id": "g2", "description": "Prompt: goal → persona → highlight text → attached notes → output contract", "plan_ref": "tasks 019 g2; spec §5.5", "status": "pending"},
    {"id": "g3", "description": "Write mini_conclusions; the client picks it up through the broadcast like any other row", "plan_ref": "tasks 019 g3; db §8.1 DB-F5", "status": "pending"},
    {"id": "g4", "description": "Skip needs-correction highlights below the OCR gate", "plan_ref": "tasks 019 g4", "status": "pending"},
    {"id": "g5", "description": "Budget check: a 40-highlight workspace costs ≈42 calls, not 40 × 7", "plan_ref": "tasks 019 g5; spec §7", "status": "pending"}
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
  "task_id": "019-task-mini-conclusion",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 019"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5, §7"},
    {"doc": "02-database-architecture.md", "section": "§8.1, §10 DB-Q8"},
    {"doc": "todo-task-019-mini-conclusion.md", "section": "full file"}
  ],
  "scope": "The mini-conclusion service and endpoint. Out of scope: Call a model per note. Return the conclusion from the endpoint.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Ten edits in 3 s cause one call."},
    {"goal_id": "g2", "text": "Prompt sections appear in that order."},
    {"goal_id": "g3", "text": "The row reaches Dexie with no response body read."},
    {"goal_id": "g4", "text": "A 0.69 highlight triggers no call."},
    {"goal_id": "g5", "text": "Measured from llm_requests."}
  ],
  "open_questions": ["DB-Q8 (defaulted: `mini_conclusions` write scope as written) — who may write mini_conclusions.", "D-12 (unanswered) — inherited through 018."],
  "risks": ["Any member can overwrite a shared highlight's mini-conclusion today (DB-Q8)."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "019-task-mini-conclusion",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 019", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5, §7", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§8.1, §10 DB-Q8", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/019-todo-mini-conclusion/contract.json`:

```json
{
  "id": "019-todo-mini-conclusion",
  "name": "Mini-conclusion",
  "goal": "Each focus point gets a cheap conclusion that respects the free-tier budget.",
  "todo_path": "agent-thinking/todo/019-todo-mini-conclusion/contract.json",
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

`06-whole-apps-task.md` PHASE E · 019, `01-thinkboard-lite-spec.md` §5.5, §7, `02-database-architecture.md` §8.1, §10 DB-Q8. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
