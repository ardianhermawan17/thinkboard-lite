---
doc_id: thinkboard-lite-task-003
title: Task 003 — Types and seed
version: "1.0"
status: done — 5/5 goals (2026-09-19); g3 as placeholder rows, D-12 still unanswered; see agent-history/003-task-types-and-seed/
updated: 2026-09-18
task: "003"
phase: "B — Data contract"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 003 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 003 — Types and seed

`003-task-types-and-seed` · `supabase` (secondary `frontend`) · phase B — Data contract · depends on [`001`](todo-task-001-supabase-lite-migration.md) · blocks [`008`](todo-task-008-auth-and-workspace-shell.md), [`009`](todo-task-009-pdf-canvas.md)

**Main goal —** The frontend can import generated types and log into a populated workspace.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 003 only. |
| **Do not** | Hand-edit generated types. Put a key in a seed row. Create src/ yourself. |

---

## 1. What can go wrong

- Writing into src/ before task 004 creates it would pre-empt the folder law — g1 waits.
- Seeded provider rows look like a provider decision; D-12 is still unanswered, so mark them as placeholders.
- A seed script that uses a secret key breaks RULE-01's spirit on the client side — seed runs server/CLI side only.

---

## 2. Goals and gate

- `g1` supabase gen types typescript → src/shared/types/domain/*, branded ids preserved (I9); needs 004's src/ skeleton — blocked until it exists. *(tasks 003 g1; ffa §5 I9)*
- `g2` Seed: one team, one leader, two members, one board / column / session, one PDF artifact. *(tasks 003 g2)*
- `g3` Seed llm_providers / llm_models rows for the settings dropdown. *(tasks 003 g3)*
- `g4` Storage bucket + policy for artifact PDFs at the DB-Q11 default path; upload the seed document. *(tasks 003 g4; db §10 DB-Q11)*
- `g5` A db:seed script that resets to this state in one command (which package.json hosts it is an analyze decision). *(tasks 003 g5)*

**Gate —** A fresh checkout reaches a logged-in workspace with a real PDF in under five minutes.
**Blocks —** [`008`](todo-task-008-auth-and-workspace-shell.md), [`009`](todo-task-009-pdf-canvas.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-02 | defaulted | one `main` PDF + the leader's `note` copy | one main PDF + note slot in the seed |
| DB-Q2 | defaulted | = D-02 | = D-02 |
| DB-Q11 | defaulted | `artifacts/{sessionId}/{artifactId}.pdf` | g4 storage path and policy |
| D-12 | **unanswered** | — | g3 rows are placeholders, not a provider choice. Owner ruled 2026-09-19 that placeholders are acceptable; that is not an answer to D-12, which still gates task 018 |

---

## 4. Where the work lands

```
frontend-thinkboard-lite/src/shared/types/domain/*.ts   # generated
database-thinkboard-lite/supabase/seed.sql
database-thinkboard-lite/supabase/migrations/0005_storage_artifacts.sql   # bucket + policy (owner-approved new migration)
database-thinkboard-lite/supabase/seed/upload-pdf.mjs                     # placeholder PDF, uploaded as the seeded leader
db:seed script                                                            # database-thinkboard-lite/package.json
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- seed twice: same row counts
- storage policy: member read ok, non-member read denied

---

## 6. Hand-offs

- 008 logs into the seeded workspace
- 009 renders the seeded PDF

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/003-task-types-and-seed/task.json`

```json
{
  "id": "003-task-types-and-seed",
  "title": "The frontend can import generated types and log into a populated workspace",
  "architecture": "supabase",
  "secondary_architecture": ["frontend"],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["001-task-supabase-lite-migration"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 003"},
    {"doc": "02-database-architecture.md", "section": "§2, §6, §10 DB-Q11"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5 shared/types/domain, §12 I9"},
    {"doc": "todo-task-003-types-and-seed.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "supabase gen types typescript → src/shared/types/domain/*, branded ids preserved (I9); needs 004's src/ skeleton — blocked until it exists", "plan_ref": "tasks 003 g1; ffa §5 I9", "status": "pending"},
    {"id": "g2", "description": "Seed: one team, one leader, two members, one board / column / session, one PDF artifact", "plan_ref": "tasks 003 g2", "status": "pending"},
    {"id": "g3", "description": "Seed llm_providers / llm_models rows for the settings dropdown", "plan_ref": "tasks 003 g3", "status": "pending"},
    {"id": "g4", "description": "Storage bucket + policy for artifact PDFs at the DB-Q11 default path; upload the seed document", "plan_ref": "tasks 003 g4; db §10 DB-Q11", "status": "pending"},
    {"id": "g5", "description": "A db:seed script that resets to this state in one command (which package.json hosts it is an analyze decision)", "plan_ref": "tasks 003 g5", "status": "pending"}
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
  "task_id": "003-task-types-and-seed",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 003"},
    {"doc": "02-database-architecture.md", "section": "§2, §6, §10 DB-Q11"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5 shared/types/domain, §12 I9"},
    {"doc": "todo-task-003-types-and-seed.md", "section": "full file"}
  ],
  "scope": "Generated domain types, seed data, the storage bucket and its policy, one seed command. Out of scope: Hand-edit generated types. Put a key in a seed row. Create src/ yourself.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Generated types compile under the frontend tsconfig; ids and timestamps use ./common brands."},
    {"goal_id": "g2", "text": "db:seed produces exactly these rows."},
    {"goal_id": "g3", "text": "Rows exist; none carries a key."},
    {"goal_id": "g4", "text": "A member can read the PDF; a non-member cannot."},
    {"goal_id": "g5", "text": "One command, fresh stack to seeded state."}
  ],
  "open_questions": ["D-02 (defaulted: one `main` PDF + the leader's `note` copy) — one main PDF + note slot in the seed.", "DB-Q2 (defaulted: = D-02) — = D-02.", "DB-Q11 (defaulted: `artifacts/{sessionId}/{artifactId}.pdf`) — g4 storage path and policy.", "D-12 (unanswered) — g3 rows are placeholders, not a provider choice."],
  "risks": ["Writing into src/ before task 004 creates it would pre-empt the folder law — g1 waits.", "Seeded provider rows look like a provider decision; D-12 is still unanswered, so mark them as placeholders.", "A seed script that uses a secret key breaks RULE-01's spirit on the client side — seed runs server/CLI side only."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "003-task-types-and-seed",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 003", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§2, §6, §10 DB-Q11", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5 shared/types/domain, §12 I9", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/003-todo-types-and-seed/contract.json`:

```json
{
  "id": "003-todo-types-and-seed",
  "name": "Types and seed",
  "goal": "The frontend can import generated types and log into a populated workspace.",
  "todo_path": "agent-thinking/todo/003-todo-types-and-seed/contract.json",
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

`06-whole-apps-task.md` PHASE B · 003, `02-database-architecture.md` §2, §6, §10 DB-Q11, `04-frontend-folder-architecture.md` §5 shared/types/domain, §12 I9. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
