---
doc_id: thinkboard-lite-task-006
title: Task 006 — Entities kernel
version: "1.0"
status: done — 6/6 goals (2026-09-19), see agent-history/006-task-entities-kernel/result.json
updated: 2026-09-18
task: "006"
phase: "C — Frontend foundation"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 006 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 006 — Entities kernel

`006-task-entities-kernel` · `frontend` · phase C — Frontend foundation · depends on [`004`](todo-task-004-frontend-scaffold.md) · blocks [`007`](todo-task-007-sync-kernel.md), [`008`](todo-task-008-auth-and-workspace-shell.md)

**Main goal —** A local database that is the app's only read surface, so every later feature is offline-capable by construction.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 006 only. |
| **Do not** | Let a component touch db. Add a table not in db §6.1. Echo a remote change into the outbox. |

---

## 1. What can go wrong

- Two caches for the same rows — entities must never reach Redux (I11, I12).
- The one-bit _dirty from older docs; the flag is three-state _sync (split F2).
- A transaction scope missing the outbox table: the bug that loses a note, invisible to mocked tests.

---

## 2. Goals and gate

- `g1` Dexie schema exactly as db §6.1 — seven tables incl. runs, the [artifactId+page] index, the _sync flag — namespaced thinkboard:{profileId}, deleted on sign-out. *(tasks 006 g1; db §6.1; split C1 C2)*
- `g2` repository/ write surface — every write is row + outbox entry in ONE transaction; the row's _sync mirrors its op. *(tasks 006 g2; spec RULE-08; db §6.1)*
- `g3` queries/ read surface — named live-query hooks, at least one per table (incl. use-run); useLiveQuery nowhere else. *(tasks 006 g3; ffa §4.1 I13 I23)*
- `g4` utils/mappers.ts — toWire / toRow; notes ⇄ highlight_notes; _sync, seq and state never cross. *(tasks 006 g4; db §6.1)*
- `g5` apply-remote.ts — writes without an outbox entry; skips rows whose _sync is not clean; keys deletes on record ?? old_record (F7); handles RETRACT. *(tasks 006 g5; db §6.1; split F7)*
- `g6` Tests under fake-indexeddb: row-and-outbox atomicity; mapper key set against the column list. *(tasks 006 g6)*

**Gate —** Tests green; `dexie` imported only in `db/`, `repository/`, `queries/` (I29).
**Blocks —** [`007`](todo-task-007-sync-kernel.md), [`008`](todo-task-008-auth-and-workspace-shell.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q1 | defaulted | Dexie is the read model | Dexie is the read model |
| DB-Q3 | defaulted | per-profile Dexie; OPFS wiped with it | per-profile database name |
| DB-Q12 | defaulted | non-mirrored tables pulled into Dexie `meta`; writes via outbox | meta also holds non-mirrored tables (filled by 007) |
| C1 | resolved in split §3 | — | seven tables |
| C2 | resolved in split §3 | — | compound index |

---

## 4. Where the work lands

```
src/features/entities/db/{thinkboard-db.ts,migrations.ts,index.ts}
src/features/entities/repository/{highlight,note,artifact}-repository.ts, apply-remote.ts
src/features/entities/queries/use-*-for-*.ts, use-outbox-count.ts, use-run.ts
src/features/entities/{types,utils}/
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- atomicity: throw mid-transaction, assert neither row nor op landed
- mapper key set vs column list
- apply-remote: delete via old_record, RETRACT own vs other, non-clean row not overwritten

---

## 6. Hand-offs

- 007 drains the outbox this task fills
- every feature reads through queries/

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/006-task-entities-kernel/task.json`

```json
{
  "id": "006-task-entities-kernel",
  "title": "A local database that is the app's only read surface, so every later feature is offline-capable by construction",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["004-task-frontend-scaffold"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 006"},
    {"doc": "02-database-architecture.md", "section": "§6, §6.1"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§4.1, §12"},
    {"doc": "03-frontend-architecture.md", "section": "§3, §4, §9"},
    {"doc": "todo-task-000-split.md", "section": "§3 C1 C2, §5.3 F2 F7"},
    {"doc": "todo-task-006-entities-kernel.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Dexie schema exactly as db §6.1 — seven tables incl. runs, the [artifactId+page] index, the _sync flag — namespaced thinkboard:{profileId}, deleted on sign-out", "plan_ref": "tasks 006 g1; db §6.1; split C1 C2", "status": "pending"},
    {"id": "g2", "description": "repository/ write surface — every write is row + outbox entry in ONE transaction; the row's _sync mirrors its op", "plan_ref": "tasks 006 g2; spec RULE-08; db §6.1", "status": "pending"},
    {"id": "g3", "description": "queries/ read surface — named live-query hooks, at least one per table (incl. use-run); useLiveQuery nowhere else", "plan_ref": "tasks 006 g3; ffa §4.1 I13 I23", "status": "pending"},
    {"id": "g4", "description": "utils/mappers.ts — toWire / toRow; notes ⇄ highlight_notes; _sync, seq and state never cross", "plan_ref": "tasks 006 g4; db §6.1", "status": "pending"},
    {"id": "g5", "description": "apply-remote.ts — writes without an outbox entry; skips rows whose _sync is not clean; keys deletes on record ?? old_record (F7); handles RETRACT", "plan_ref": "tasks 006 g5; db §6.1; split F7", "status": "pending"},
    {"id": "g6", "description": "Tests under fake-indexeddb: row-and-outbox atomicity; mapper key set against the column list", "plan_ref": "tasks 006 g6", "status": "pending"}
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
  "task_id": "006-task-entities-kernel",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 006"},
    {"doc": "02-database-architecture.md", "section": "§6, §6.1"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§4.1, §12"},
    {"doc": "03-frontend-architecture.md", "section": "§3, §4, §9"},
    {"doc": "todo-task-000-split.md", "section": "§3 C1 C2, §5.3 F2 F7"},
    {"doc": "todo-task-006-entities-kernel.md", "section": "full file"}
  ],
  "scope": "The Dexie mirror, its write and read surfaces, mappers and apply-remote. No Supabase calls. Out of scope: Let a component touch db. Add a table not in db §6.1. Echo a remote change into the outbox.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "db.version(1).stores matches db §6.1 character for character."},
    {"goal_id": "g2", "text": "No code path writes a row without its outbox op, or vice versa."},
    {"goal_id": "g3", "text": "I13 and I23 pass."},
    {"goal_id": "g4", "text": "toWire output keys equal the Postgres column list."},
    {"goal_id": "g5", "text": "A remote DELETE removes the row; a RETRACT for my own row is ignored."},
    {"goal_id": "g6", "text": "Both tests fail if the transaction is split or a column is added."}
  ],
  "open_questions": ["Q1 (defaulted: Dexie is the read model) — Dexie is the read model.", "DB-Q3 (defaulted: per-profile Dexie; OPFS wiped with it) — per-profile database name.", "DB-Q12 (defaulted: non-mirrored tables pulled into Dexie `meta`; writes via outbox) — meta also holds non-mirrored tables (filled by 007).", "C1 — seven tables.", "C2 — compound index."],
  "risks": ["Two caches for the same rows — entities must never reach Redux (I11, I12).", "The one-bit _dirty from older docs; the flag is three-state _sync (split F2).", "A transaction scope missing the outbox table: the bug that loses a note, invisible to mocked tests."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "006-task-entities-kernel",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 006", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§6, §6.1", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§4.1, §12", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§3, §4, §9", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§3 C1 C2, §5.3 F2 F7", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/006-todo-entities-kernel/contract.json`:

```json
{
  "id": "006-todo-entities-kernel",
  "name": "Entities kernel",
  "goal": "A local database that is the app's only read surface, so every later feature is offline-capable by construction.",
  "todo_path": "agent-thinking/todo/006-todo-entities-kernel/contract.json",
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

`06-whole-apps-task.md` PHASE C · 006, `02-database-architecture.md` §6, §6.1, `04-frontend-folder-architecture.md` §4.1, §12, `03-frontend-architecture.md` §3, §4, §9, `todo-task-000-split.md` §3 C1 C2, §5.3 F2 F7. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
