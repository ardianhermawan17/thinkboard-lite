---
doc_id: thinkboard-lite-task-024
title: Task 024 — Ink fallback (conditional)
version: "1.0"
status: proposed
updated: 2026-09-18
task: "024"
phase: "F — Hardening"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 024 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 024 — Ink fallback (conditional)

`024-task-ink-fallback` · `frontend` · phase F — Hardening · depends on [`012`](todo-task-012-notes-and-handwriting.md) · blocks —

**Main goal —** Members whose tablet cannot convert handwriting can still write by hand.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | **Conditional.** Open this task only if task 012 `g6` failed. If OS handwriting works on the pilot's tablets, close this plan doc as not-needed — and task 000's I25 then skips the `ink-pad` leaf. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 024 only. |
| **Do not** | Make ink the default. Rasterize ink for Tesseract. |

---

## 1. What can go wrong

- The vision-model tier sends handwriting images to a provider — D-12 applies here too.
- Widening OutboxOp.op without updating db §6.1 and the blueprint breaks the one-definition rule.

---

## 2. Goals and gate

- `g1` ink-pad canvas leaf behind a draw-instead control; opened deliberately, never the default. *(tasks 024 g1; v2 §3.5)*
- `g2` Strokes {x,y,t,pressure} → highlight_notes.ink as JSON; rendered as SVG, never a raster image. *(tasks 024 g2; spec RULE-18)*
- `g3` transcribe outbox op: try navigator.createHandwritingRecognizer(), else one vision-model call on reconnect, else leave as ink and stop asking. *(tasks 024 g3)*
- `g4` transcribed_by recorded; ink kept beside the transcript, never destroyed. *(tasks 024 g4; spec RULE-18)*

**Gate —** An ink note survives offline capture, reconnect and transcription with the strokes intact.
**Blocks —** —.

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q7 | **unanswered** | run the 45-minute device test | decides whether this task exists |
| D-12 | **unanswered** | — | tier-1 transcription sends ink to a model |
| C6 | **awaiting human sign-off** (split §3) | three-value enum | input_mode 'ink' and transcribed_by already exist |

---

## 4. Where the work lands

```
src/shared/components/canvas/ink-pad/ (+ painter)
src/shared/lib/handwriting.ts (tier B ladder)
src/features/notes/
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- offline capture → reconnect → transcription
- strokes survive transcript edits

---

## 6. Hand-offs

- blueprint ink-pad.status moves from conditional to active

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/024-task-ink-fallback/task.json`

```json
{
  "id": "024-task-ink-fallback",
  "title": "Members whose tablet cannot convert handwriting can still write by hand",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["012-task-notes-and-handwriting"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 024"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§3.2, §3.5"},
    {"doc": "todo-task-000-split.md", "section": "§3 C4"},
    {"doc": "02-database-architecture.md", "section": "§6.1"},
    {"doc": "todo-task-024-ink-fallback.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "ink-pad canvas leaf behind a draw-instead control; opened deliberately, never the default", "plan_ref": "tasks 024 g1; v2 §3.5", "status": "pending"},
    {"id": "g2", "description": "Strokes {x,y,t,pressure} → highlight_notes.ink as JSON; rendered as SVG, never a raster image", "plan_ref": "tasks 024 g2; spec RULE-18", "status": "pending"},
    {"id": "g3", "description": "transcribe outbox op: try navigator.createHandwritingRecognizer(), else one vision-model call on reconnect, else leave as ink and stop asking", "plan_ref": "tasks 024 g3", "status": "pending"},
    {"id": "g4", "description": "transcribed_by recorded; ink kept beside the transcript, never destroyed", "plan_ref": "tasks 024 g4; spec RULE-18", "status": "pending"}
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
  "task_id": "024-task-ink-fallback",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 024"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§3.2, §3.5"},
    {"doc": "todo-task-000-split.md", "section": "§3 C4"},
    {"doc": "02-database-architecture.md", "section": "§6.1"},
    {"doc": "todo-task-024-ink-fallback.md", "section": "full file"}
  ],
  "scope": "The deliberate ink fallback and its transcription ladder. Out of scope: Make ink the default. Rasterize ink for Tesseract.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "The default note surface stays the textarea."},
    {"goal_id": "g2", "text": "No PNG is ever produced."},
    {"goal_id": "g3", "text": "OutboxOp.op gains 'transcribe' in db §6.1 first."},
    {"goal_id": "g4", "text": "Editing the transcript leaves ink untouched."}
  ],
  "open_questions": ["Q7 (unanswered: run the 45-minute device test) — decides whether this task exists.", "D-12 (unanswered) — tier-1 transcription sends ink to a model.", "C6 — input_mode 'ink' and transcribed_by already exist."],
  "risks": ["The vision-model tier sends handwriting images to a provider — D-12 applies here too.", "Widening OutboxOp.op without updating db §6.1 and the blueprint breaks the one-definition rule."]
}
```

### 7.3 `validate.json` — 4 goal checks, no exceptions

```json
{
  "task_id": "024-task-ink-fallback",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 024", "result": ""},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§3.2, §3.5", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§3 C4", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§6.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/024-todo-ink-fallback/contract.json`:

```json
{
  "id": "024-todo-ink-fallback",
  "name": "Ink fallback (conditional)",
  "goal": "Members whose tablet cannot convert handwriting can still write by hand.",
  "todo_path": "agent-thinking/todo/024-todo-ink-fallback/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · anything
touching RLS or stage transitions cannot reach validate with `test.json.summary.total: 0` · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every
time** (`09-agent-limitation.md` §1), on the shadow branch, never `master` · `npm run verify` green before a
frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE F · 024, `05-frontend-sync-handwriting.md` §3.2, §3.5, `todo-task-000-split.md` §3 C4, `02-database-architecture.md` §6.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
