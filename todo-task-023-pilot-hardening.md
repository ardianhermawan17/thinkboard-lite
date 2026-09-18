---
doc_id: thinkboard-lite-task-023
title: Task 023 — Pilot hardening
version: "1.0"
status: proposed
updated: 2026-09-18
task: "023"
phase: "F — Hardening"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 023 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 023 — Pilot hardening

`023-task-pilot-hardening` · `backend` (secondary `frontend`) · phase F — Hardening · depends on [`015`](todo-task-015-realtime-presence.md), [`016`](todo-task-016-offline-and-export.md), [`020`](todo-task-020-result-engine.md), [`022`](todo-task-022-responsive-motion-theme.md) · blocks —

**Main goal —** The pilot survives a real week: bad network, exhausted quota, unhappy paths.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 023 only. |
| **Do not** | Hide a parked op. Add an endpoint for telemetry the client can write under RLS (RULE-23). |

---

## 1. What can go wrong

- realtime.messages is WAL traffic with 3-day retention — nothing may read it as a log (split §5.2).
- STABLE helpers matter at load (split §5.2 #1).

---

## 2. Goals and gate

- `g1` Queued runs surfaced with position and expected time, not a spinner. *(tasks 023 g1)*
- `g2` Every empty / error / offline / parked-op state designed, not defaulted. *(tasks 023 g2)*
- `g3` Failed outbox ops visible and retryable from the sync pill. *(tasks 023 g3; split F1)*
- `g4` Telemetry: Tier-A handwriting adoption (transcribed_by / input_mode), sync failure rate, LLM cost per workspace. *(tasks 023 g4)*
- `g5` Load sanity: one workspace, six members, 200 highlights, eight hours. *(tasks 023 g5; split §5.2)*

**Gate —** A full pilot day with the network deliberately broken three times, and no data loss.
**Blocks —** —.

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q8 | **unanswered** | — | the pilot's real devices |
| D-12 | **unanswered** | — | cost telemetry reflects the providers chosen |

---

## 4. Where the work lands

```
src/features/sync/components/sync-status-pill/
src/features/result/ (queued state)
src/server/llm/usage.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- network broken three times
- parked-op retry
- load profile

---

## 6. Hand-offs

- the pilot

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/023-task-pilot-hardening/task.json`

```json
{
  "id": "023-task-pilot-hardening",
  "title": "The pilot survives a real week: bad network, exhausted quota, unhappy paths",
  "architecture": "backend",
  "secondary_architecture": ["frontend"],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["015-task-realtime-presence", "016-task-offline-and-export", "020-task-result-engine", "022-task-responsive-motion-theme"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 023"},
    {"doc": "todo-task-000-split.md", "section": "§5.2, §5.3"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§11"},
    {"doc": "todo-task-023-pilot-hardening.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Queued runs surfaced with position and expected time, not a spinner", "plan_ref": "tasks 023 g1", "status": "pending"},
    {"id": "g2", "description": "Every empty / error / offline / parked-op state designed, not defaulted", "plan_ref": "tasks 023 g2", "status": "pending"},
    {"id": "g3", "description": "Failed outbox ops visible and retryable from the sync pill", "plan_ref": "tasks 023 g3; split F1", "status": "pending"},
    {"id": "g4", "description": "Telemetry: Tier-A handwriting adoption (transcribed_by / input_mode), sync failure rate, LLM cost per workspace", "plan_ref": "tasks 023 g4", "status": "pending"},
    {"id": "g5", "description": "Load sanity: one workspace, six members, 200 highlights, eight hours", "plan_ref": "tasks 023 g5; split §5.2", "status": "pending"}
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
  "task_id": "023-task-pilot-hardening",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 023"},
    {"doc": "todo-task-000-split.md", "section": "§5.2, §5.3"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§11"},
    {"doc": "todo-task-023-pilot-hardening.md", "section": "full file"}
  ],
  "scope": "Queued-run UX, designed states, parked-op recovery, telemetry, load sanity. Out of scope: Hide a parked op. Add an endpoint for telemetry the client can write under RLS (RULE-23).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "A queued run shows its position."},
    {"goal_id": "g2", "text": "Each state has a story."},
    {"goal_id": "g3", "text": "A parked op can be retried or discarded from the pill."},
    {"goal_id": "g4", "text": "Three metrics readable for the pilot."},
    {"goal_id": "g5", "text": "No data loss; write volume near the split §5.2 estimate."}
  ],
  "open_questions": ["Q8 (unanswered) — the pilot's real devices.", "D-12 (unanswered) — cost telemetry reflects the providers chosen."],
  "risks": ["realtime.messages is WAL traffic with 3-day retention — nothing may read it as a log (split §5.2).", "STABLE helpers matter at load (split §5.2 #1)."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "023-task-pilot-hardening",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 023", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§5.2, §5.3", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§11", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/023-todo-pilot-hardening/contract.json`:

```json
{
  "id": "023-todo-pilot-hardening",
  "name": "Pilot hardening",
  "goal": "The pilot survives a real week: bad network, exhausted quota, unhappy paths.",
  "todo_path": "agent-thinking/todo/023-todo-pilot-hardening/contract.json",
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

`06-whole-apps-task.md` PHASE F · 023, `todo-task-000-split.md` §5.2, §5.3, `01-thinkboard-lite-spec.md` §11. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
