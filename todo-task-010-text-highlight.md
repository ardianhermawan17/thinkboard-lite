---
doc_id: thinkboard-lite-task-010
title: Task 010 — Text highlight
version: "1.0"
status: proposed
updated: 2026-09-18
task: "010"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 010 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 010 — Text highlight

`010-task-text-highlight` · `frontend` · phase D — Frontend features · depends on [`009`](todo-task-009-pdf-canvas.md) · blocks [`012`](todo-task-012-notes-and-handwriting.md), [`013`](todo-task-013-sheets-and-promotion.md), [`021`](todo-task-021-leader-import.md)

**Main goal —** Selecting text on the PDF creates a persisted, exact-text focus point.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 010 only. |
| **Do not** | Edit highlight geometry in place (RULE-16). Capture text from the Konva layer. |

---

## 1. What can go wrong

- The most likely task to overrun (tasks §4): coordinates across zoom, rotation and re-render.
- Viewport pixels in bbox — the bug that appears weeks later on another tablet (db §4.2).

---

## 2. Goals and gate

- `g1` Selection/Range capture over the PDF.js text layer → client rects → normalized rects. *(tasks 010 g1; spec §5.4)*
- `g2` Slug generation h-pNN-NN-xxxxxx, deterministic from text + quantized rect. *(tasks 010 g2; spec §5.6)*
- `g3` repository.createHighlight() with extraction='text_layer', confidence=1.0, layer='individual'. *(tasks 010 g3)*
- `g4` highlight-layer canvas leaf draws stored highlights from the live query. *(tasks 010 g4; ffa §5.2)*
- `g5` Zoom-then-reload test: marks land in the same place. *(tasks 010 g5; spec RULE-17)*

**Gate —** Highlight, zoom, rotate, reload — still correct. The hardest problem in the project.
**Blocks —** [`012`](todo-task-012-notes-and-handwriting.md), [`013`](todo-task-013-sheets-and-promotion.md), [`021`](todo-task-021-leader-import.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| — | — | — | no open decision; RULE-09, RULE-16 and RULE-17 govern it |

---

## 4. Where the work lands

```
src/features/highlight/
src/shared/components/canvas/highlight-layer/ (+ painter)
src/shared/lib/slug.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- zoom-then-reload
- slug determinism
- painter-only imperative Konva

---

## 6. Hand-offs

- 012 attaches notes to these highlights
- 013 promotes them
- 021 reuses the text-layer intersection

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/010-task-text-highlight/task.json`

```json
{
  "id": "010-task-text-highlight",
  "title": "Selecting text on the PDF creates a persisted, exact-text focus point",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["009-task-pdf-canvas"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 010, §4"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, §5.6, RULE-16/17"},
    {"doc": "02-database-architecture.md", "section": "§4.2"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1"},
    {"doc": "todo-task-010-text-highlight.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Selection/Range capture over the PDF.js text layer → client rects → normalized rects", "plan_ref": "tasks 010 g1; spec §5.4", "status": "pending"},
    {"id": "g2", "description": "Slug generation h-pNN-NN-xxxxxx, deterministic from text + quantized rect", "plan_ref": "tasks 010 g2; spec §5.6", "status": "pending"},
    {"id": "g3", "description": "repository.createHighlight() with extraction='text_layer', confidence=1.0, layer='individual'", "plan_ref": "tasks 010 g3", "status": "pending"},
    {"id": "g4", "description": "highlight-layer canvas leaf draws stored highlights from the live query", "plan_ref": "tasks 010 g4; ffa §5.2", "status": "pending"},
    {"id": "g5", "description": "Zoom-then-reload test: marks land in the same place", "plan_ref": "tasks 010 g5; spec RULE-17", "status": "pending"}
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
  "task_id": "010-task-text-highlight",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 010, §4"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, §5.6, RULE-16/17"},
    {"doc": "02-database-architecture.md", "section": "§4.2"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1"},
    {"doc": "todo-task-010-text-highlight.md", "section": "full file"}
  ],
  "scope": "Text-layer highlight capture, slugs, persistence and drawing. Out of scope: Edit highlight geometry in place (RULE-16). Capture text from the Konva layer.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Rects leaving capture are 0-1 page-relative."},
    {"goal_id": "g2", "text": "Same text and rect always give the same slug."},
    {"goal_id": "g3", "text": "Row and outbox op land together."},
    {"goal_id": "g4", "text": "Drawing goes through the painter only (I17)."},
    {"goal_id": "g5", "text": "Automated test at three zoom levels and after rotation."}
  ],
  "open_questions": [],
  "risks": ["The most likely task to overrun (tasks §4): coordinates across zoom, rotation and re-render.", "Viewport pixels in bbox — the bug that appears weeks later on another tablet (db §4.2)."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "010-task-text-highlight",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 010, §4", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, §5.6, RULE-16/17", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§4.2", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§6.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/010-todo-text-highlight/contract.json`:

```json
{
  "id": "010-todo-text-highlight",
  "name": "Text highlight",
  "goal": "Selecting text on the PDF creates a persisted, exact-text focus point.",
  "todo_path": "agent-thinking/todo/010-todo-text-highlight/contract.json",
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

`06-whole-apps-task.md` PHASE D · 010, §4, `01-thinkboard-lite-spec.md` §5.4, §5.6, RULE-16/17, `02-database-architecture.md` §4.2, `03-frontend-architecture.md` §6.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
