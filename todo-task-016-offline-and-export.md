---
doc_id: thinkboard-lite-task-016
title: Task 016 — Offline and export
version: "1.0"
status: proposed
updated: 2026-09-18
task: "016"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 016 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 016 — Offline and export

`016-task-offline-and-export` · `frontend` · phase D — Frontend features · depends on [`007`](todo-task-007-sync-kernel.md) · blocks [`023`](todo-task-023-pilot-hardening.md)

**Main goal —** The private sheet works with the network off, and a workspace can leave as a portable bundle.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 016 only. |
| **Do not** | Silently exit offline mode. Guess an anchor on re-import. |

---

## 1. What can go wrong

- A shared tablet leaking the previous user's PDF bytes (F6).
- Re-rendering a page on export destroys the text layer (spec §5.6).

---

## 2. Goals and gate

- `g1` Mode switch — manual Work offline is authoritative; auto-detect may only degrade, never silently resync. *(tasks 016 g1; spec §5.3)*
- `g2` Offline UI: group sheet read-only with lastSyncedAt; disabled affordances labelled, not hidden. *(tasks 016 g2)*
- `g3` "Back online · N changes to sync" with an explicit button. *(tasks 016 g3)*
- `g4` Export: document.pdf with /Highlight annotations appended (/NM = slug), notes.md with <!-- tb … --> anchors, thinkboard.json, zipped with fflate. *(tasks 016 g4; spec §5.6)*
- `g5` Re-import: the HTML comment is the only identity anchor; anchorless sections import as new unanchored notes; orphans reported, never guessed. *(tasks 016 g5; spec RULE-25)*
- `g6` Clear local data on sign out — Dexie AND OPFS (F6); the group document is not cached offline by default. *(tasks 016 g6; split F6; spec D-10)*

**Gate —** Airplane mode: open, highlight, note, export. Reconnect: everything lands once. Export → edit prose → re-import → no duplicates.
**Blocks —** [`023`](todo-task-023-pilot-hardening.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-10 | defaulted | group document not cached offline | g6 |
| DB-Q3 | defaulted | per-profile Dexie; OPFS wiped with it | sign-out deletes the profile's database |
| RULE-15 | standing rule (spec §3) | — | conflict keeps local text as a second note |

---

## 4. Where the work lands

```
src/features/sync/ (mode switch wiring)
src/shared/lib/bundle.ts
src/features/workspace/ (sign-out wipe)
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- export/re-import round trip
- sign-out wipes Dexie + OPFS
- manual mode authority

---

## 6. Hand-offs

- 023 breaks the network deliberately on top of this

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/016-task-offline-and-export/task.json`

```json
{
  "id": "016-task-offline-and-export",
  "title": "The private sheet works with the network off, and a workspace can leave as a portable bundle",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["007-task-sync-kernel"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 016"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §5.6, RULE-14/15/25"},
    {"doc": "todo-task-000-split.md", "section": "§5.3 F6"},
    {"doc": "todo-task-016-offline-and-export.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Mode switch — manual Work offline is authoritative; auto-detect may only degrade, never silently resync", "plan_ref": "tasks 016 g1; spec §5.3", "status": "pending"},
    {"id": "g2", "description": "Offline UI: group sheet read-only with lastSyncedAt; disabled affordances labelled, not hidden", "plan_ref": "tasks 016 g2", "status": "pending"},
    {"id": "g3", "description": "\"Back online · N changes to sync\" with an explicit button", "plan_ref": "tasks 016 g3", "status": "pending"},
    {"id": "g4", "description": "Export: document.pdf with /Highlight annotations appended (/NM = slug), notes.md with <!-- tb … --> anchors, thinkboard.json, zipped with fflate", "plan_ref": "tasks 016 g4; spec §5.6", "status": "pending"},
    {"id": "g5", "description": "Re-import: the HTML comment is the only identity anchor; anchorless sections import as new unanchored notes; orphans reported, never guessed", "plan_ref": "tasks 016 g5; spec RULE-25", "status": "pending"},
    {"id": "g6", "description": "Clear local data on sign out — Dexie AND OPFS (F6); the group document is not cached offline by default", "plan_ref": "tasks 016 g6; split F6; spec D-10", "status": "pending"}
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
  "task_id": "016-task-offline-and-export",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 016"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §5.6, RULE-14/15/25"},
    {"doc": "todo-task-000-split.md", "section": "§5.3 F6"},
    {"doc": "todo-task-016-offline-and-export.md", "section": "full file"}
  ],
  "scope": "Mode switch, offline UI, reconnect prompt, export and re-import, sign-out wipe. Out of scope: Silently exit offline mode. Guess an anchor on re-import.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Reconnecting never syncs without the button."},
    {"goal_id": "g2", "text": "Every disabled control explains why."},
    {"goal_id": "g3", "text": "N equals the outbox count."},
    {"goal_id": "g4", "text": "Original PDF bytes are appended to, never re-rendered."},
    {"goal_id": "g5", "text": "Export → edit → re-import creates no duplicates."},
    {"goal_id": "g6", "text": "After sign-out, OPFS holds no file of the previous profile."}
  ],
  "open_questions": ["D-10 (defaulted: group document not cached offline) — g6.", "DB-Q3 (defaulted: per-profile Dexie; OPFS wiped with it) — sign-out deletes the profile's database.", "RULE-15 — conflict keeps local text as a second note."],
  "risks": ["A shared tablet leaking the previous user's PDF bytes (F6).", "Re-rendering a page on export destroys the text layer (spec §5.6)."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "016-task-offline-and-export",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 016", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §5.6, RULE-14/15/25", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§5.3 F6", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/016-todo-offline-and-export/contract.json`:

```json
{
  "id": "016-todo-offline-and-export",
  "name": "Offline and export",
  "goal": "The private sheet works with the network off, and a workspace can leave as a portable bundle.",
  "todo_path": "agent-thinking/todo/016-todo-offline-and-export/contract.json",
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

`06-whole-apps-task.md` PHASE D · 016, `01-thinkboard-lite-spec.md` §5.3, §5.6, RULE-14/15/25, `todo-task-000-split.md` §5.3 F6. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
