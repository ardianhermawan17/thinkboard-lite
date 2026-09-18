---
doc_id: thinkboard-lite-task-015
title: Task 015 — Realtime presence
version: "1.0"
status: proposed
updated: 2026-09-18
task: "015"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 015 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 015 — Realtime presence

`015-task-realtime-presence` · `frontend` (secondary `supabase`) · phase D — Frontend features · depends on [`007`](todo-task-007-sync-kernel.md) · blocks [`023`](todo-task-023-pilot-hardening.md)

**Main goal —** A workspace feels shared: you see who is there and marks appear as they are made.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 015 only. |
| **Do not** | Put cursors in React state or Redux. Send client broadcasts on ws:{sessionId}. |

---

## 1. What can go wrong

- Client inserts on ws: would let a member forge a database-change event into teammates' Dexie (DB-Q9).
- 100 state updates a second through React drop frames (fa §3).

---

## 2. Goals and gate

- `g1` Presence: who is here, which page. *(tasks 015 g1; spec §5.2)*
- `g2` peer-cursors canvas leaf — refs and imperative paint only, never React state; throttled ~20 Hz, sent only on real movement. *(tasks 015 g2; spec RULE-20)*
- `g3` Broadcast-from-database events applied via applyRemote; same render path as a local write. *(tasks 015 g3; fa §4.2)*
- `g4` "Leader is drawing" ephemeral indicator. *(tasks 015 g4)*
- `g5` Two-browser test: latency ~100-300 ms; a private highlight arrives on no shared topic. *(tasks 015 g5)*
- `g6` 0005_live_topic.sql: a live:{sessionId} topic for client-sent broadcast + presence, members only; ws: and user: stay database-sent only (DB-Q9 default). *(db §10 DB-Q9)*

**Gate —** Five simulated peers at 20 Hz with no dropped frames on the pilot tablet.
**Blocks —** [`023`](todo-task-023-pilot-hardening.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| DB-Q9 | defaulted | separate `live:{sessionId}` topic | g6 |
| Q8 | **unanswered** | — | measure on the real tablet |

---

## 4. Where the work lands

```
src/features/presence/
src/shared/components/canvas/peer-cursors/ (+ painter)
database-thinkboard-lite/supabase/migrations/0005_live_topic.sql
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- forged ws: insert denied
- cursor throttle
- five-peer frame budget

---

## 6. Hand-offs

- 023 load-tests the socket

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/015-task-realtime-presence/task.json`

```json
{
  "id": "015-task-realtime-presence",
  "title": "A workspace feels shared: you see who is there and marks appear as they are made",
  "architecture": "frontend",
  "secondary_architecture": ["supabase"],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["007-task-sync-kernel"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 015"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-03, RULE-20"},
    {"doc": "02-database-architecture.md", "section": "§8.1, §10 DB-Q9"},
    {"doc": "03-frontend-architecture.md", "section": "§3, §4.2"},
    {"doc": "todo-task-015-realtime-presence.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Presence: who is here, which page", "plan_ref": "tasks 015 g1; spec §5.2", "status": "pending"},
    {"id": "g2", "description": "peer-cursors canvas leaf — refs and imperative paint only, never React state; throttled ~20 Hz, sent only on real movement", "plan_ref": "tasks 015 g2; spec RULE-20", "status": "pending"},
    {"id": "g3", "description": "Broadcast-from-database events applied via applyRemote; same render path as a local write", "plan_ref": "tasks 015 g3; fa §4.2", "status": "pending"},
    {"id": "g4", "description": "\"Leader is drawing\" ephemeral indicator", "plan_ref": "tasks 015 g4", "status": "pending"},
    {"id": "g5", "description": "Two-browser test: latency ~100-300 ms; a private highlight arrives on no shared topic", "plan_ref": "tasks 015 g5", "status": "pending"},
    {"id": "g6", "description": "0005_live_topic.sql: a live:{sessionId} topic for client-sent broadcast + presence, members only; ws: and user: stay database-sent only (DB-Q9 default)", "plan_ref": "db §10 DB-Q9", "status": "pending"}
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
  "task_id": "015-task-realtime-presence",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 015"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-03, RULE-20"},
    {"doc": "02-database-architecture.md", "section": "§8.1, §10 DB-Q9"},
    {"doc": "03-frontend-architecture.md", "section": "§3, §4.2"},
    {"doc": "todo-task-015-realtime-presence.md", "section": "full file"}
  ],
  "scope": "Presence, cursors, live broadcast application, the live topic migration. Out of scope: Put cursors in React state or Redux. Send client broadcasts on ws:{sessionId}.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Presence self-cleans on disconnect."},
    {"goal_id": "g2", "text": "No cursor value passes through useState."},
    {"goal_id": "g3", "text": "A teammate's highlight re-renders through the same live query."},
    {"goal_id": "g4", "text": "Indicator clears when the stroke ends."},
    {"goal_id": "g5", "text": "Measured latency recorded in test.json."},
    {"goal_id": "g6", "text": "A member cannot insert a message on ws:{sessionId}."}
  ],
  "open_questions": ["DB-Q9 (defaulted: separate `live:{sessionId}` topic) — g6.", "Q8 (unanswered) — measure on the real tablet."],
  "risks": ["Client inserts on ws: would let a member forge a database-change event into teammates' Dexie (DB-Q9).", "100 state updates a second through React drop frames (fa §3)."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "015-task-realtime-presence",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""},
    {"goal_id": "g6", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 015", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-03, RULE-20", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§8.1, §10 DB-Q9", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§3, §4.2", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/015-todo-realtime-presence/contract.json`:

```json
{
  "id": "015-todo-realtime-presence",
  "name": "Realtime presence",
  "goal": "A workspace feels shared: you see who is there and marks appear as they are made.",
  "todo_path": "agent-thinking/todo/015-todo-realtime-presence/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **6 here** · anything
touching RLS or stage transitions cannot reach validate with `test.json.summary.total: 0` · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every
time** (`09-agent-limitation.md` §1), on the shadow branch, never `master` · `npm run verify` green before a
frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE D · 015, `01-thinkboard-lite-spec.md` §5.2, RULE-03, RULE-20, `02-database-architecture.md` §8.1, §10 DB-Q9, `03-frontend-architecture.md` §3, §4.2. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
