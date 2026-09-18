---
doc_id: thinkboard-lite-task-013
title: Task 013 — Sheets and promotion
version: "1.0"
status: proposed
updated: 2026-09-18
task: "013"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 013 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 013 — Sheets and promotion

`013-task-sheets-and-promotion` · `frontend` · phase D — Frontend features · depends on [`010`](todo-task-010-text-highlight.md), [`012`](todo-task-012-notes-and-handwriting.md) · blocks [`014`](todo-task-014-result-ui-against-stub.md)

**Main goal —** The three sheets work, and a member can put their own thinking forward to the group.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 013 only. |
| **Do not** | Copy rows into a group table. Add a leader hide control. |

---

## 1. What can go wrong

- Leader edits of minutes (D-06) and hide/delete (D-08) are tempting additions — v1 has neither delete nor hide.
- A promoted note's highlight still private (DB-Q7) — RLS hides it, the UI must not break on it.

---

## 2. Goals and gate

- `g1` individual_notes sheet — my highlights and notes for the current page, with a Share to group control. *(tasks 013 g1)*
- `g2` group_notes sheet — group-layer highlights, promoted member notes, the leader's notulen (memory_entries scope='group'). *(tasks 013 g2; spec §5.1)*
- `g3` result sheet shell with Individual / Group tabs. *(tasks 013 g3)*
- `g4` promote_highlight() wired as an outbox rpc op; optimistic through the repository; leader-only affordances hidden for members. *(tasks 013 g4; db §6.1; spec RULE-05)*
- `g5` One sheet at a time below 1280px; docked right rail above it. *(tasks 013 g5; fa §7)*

**Gate —** As a member: private note invisible to a teammate; promote; now visible. Matches task 002's tests from the UI.
**Blocks —** [`014`](todo-task-014-result-ui-against-stub.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-06 | defaulted | leader edits generated minutes as a draft | minutes are an editable draft |
| D-07 | defaulted | explicit promotion via `shared_at` | g4 |
| D-08 | defaulted | leader cannot hide or delete a promoted note | no hide / delete control |
| DB-Q7 | defaulted | member group-visibility notes allowed as written | handle a group note whose highlight is private |
| Q11 | defaulted | dock ≥1280, overlay below | g5 |

---

## 4. Where the work lands

```
src/features/notes/components/{individual-sheet,group-sheet}/
src/features/result/components/result-sheet/
src/features/highlight/ (promote action)
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- promote via outbox rpc
- member vs leader affordances
- sheet docking at 1279/1280

---

## 6. Hand-offs

- 014 fills the result sheet

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/013-task-sheets-and-promotion/task.json`

```json
{
  "id": "013-task-sheets-and-promotion",
  "title": "The three sheets work, and a member can put their own thinking forward to the group",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["010-task-text-highlight", "012-task-notes-and-handwriting"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 013"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.1, RULE-05/06, §10"},
    {"doc": "02-database-architecture.md", "section": "§4.1, §6.1"},
    {"doc": "todo-task-013-sheets-and-promotion.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "individual_notes sheet — my highlights and notes for the current page, with a Share to group control", "plan_ref": "tasks 013 g1", "status": "pending"},
    {"id": "g2", "description": "group_notes sheet — group-layer highlights, promoted member notes, the leader's notulen (memory_entries scope='group')", "plan_ref": "tasks 013 g2; spec §5.1", "status": "pending"},
    {"id": "g3", "description": "result sheet shell with Individual / Group tabs", "plan_ref": "tasks 013 g3", "status": "pending"},
    {"id": "g4", "description": "promote_highlight() wired as an outbox rpc op; optimistic through the repository; leader-only affordances hidden for members", "plan_ref": "tasks 013 g4; db §6.1; spec RULE-05", "status": "pending"},
    {"id": "g5", "description": "One sheet at a time below 1280px; docked right rail above it", "plan_ref": "tasks 013 g5; fa §7", "status": "pending"}
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
  "task_id": "013-task-sheets-and-promotion",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 013"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.1, RULE-05/06, §10"},
    {"doc": "02-database-architecture.md", "section": "§4.1, §6.1"},
    {"doc": "todo-task-013-sheets-and-promotion.md", "section": "full file"}
  ],
  "scope": "The three sheets and promotion. Out of scope: Copy rows into a group table. Add a leader hide control.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Only my rows appear."},
    {"goal_id": "g2", "text": "Reads layer='group' OR shared_at set."},
    {"goal_id": "g3", "text": "Both tabs render their empty state."},
    {"goal_id": "g4", "text": "Promotion offline queues and lands on reconnect."},
    {"goal_id": "g5", "text": "Breakpoint from useBreakpoint only."}
  ],
  "open_questions": ["D-06 (defaulted: leader edits generated minutes as a draft) — minutes are an editable draft.", "D-07 (defaulted: explicit promotion via `shared_at`) — g4.", "D-08 (defaulted: leader cannot hide or delete a promoted note) — no hide / delete control.", "DB-Q7 (defaulted: member group-visibility notes allowed as written) — handle a group note whose highlight is private.", "Q11 (defaulted: dock ≥1280, overlay below) — g5."],
  "risks": ["Leader edits of minutes (D-06) and hide/delete (D-08) are tempting additions — v1 has neither delete nor hide.", "A promoted note's highlight still private (DB-Q7) — RLS hides it, the UI must not break on it."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "013-task-sheets-and-promotion",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 013", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.1, RULE-05/06, §10", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§4.1, §6.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/013-todo-sheets-and-promotion/contract.json`:

```json
{
  "id": "013-todo-sheets-and-promotion",
  "name": "Sheets and promotion",
  "goal": "The three sheets work, and a member can put their own thinking forward to the group.",
  "todo_path": "agent-thinking/todo/013-todo-sheets-and-promotion/contract.json",
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

`06-whole-apps-task.md` PHASE D · 013, `01-thinkboard-lite-spec.md` §5.1, RULE-05/06, §10, `02-database-architecture.md` §4.1, §6.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
