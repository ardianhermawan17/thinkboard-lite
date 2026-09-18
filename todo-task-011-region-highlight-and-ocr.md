---
doc_id: thinkboard-lite-task-011
title: Task 011 — Region highlight and OCR
version: "1.0"
status: proposed
updated: 2026-09-18
task: "011"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 011 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 011 — Region highlight and OCR

`011-task-region-highlight-and-ocr` · `frontend` · phase D — Frontend features · depends on [`009`](todo-task-009-pdf-canvas.md) · blocks [`021`](todo-task-021-leader-import.md)

**Main goal —** Pages with no text layer can still be marked, with confidence-gated OCR text.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 011 only. |
| **Do not** | Rasterize ink for Tesseract. OCR a whole page. |

---

## 1. What can go wrong

- Stroke points in React state drop frames (fa §3).
- motion on a Konva node (I20).
- OCR on handwriting is weak — the gate protects the Result, not the note.

---

## 2. Goals and gate

- `g1` marquee + freehand ink leaves with a *.painter.ts — refs, rAF, batchDraw; the only imperative Konva files. *(tasks 011 g1; fa §6.1)*
- `g2` Stylus: Pointer Events, pointerType==='pen' palm rejection, touch-action:none only while a draw tool is active. *(tasks 011 g2; fa §7)*
- `g3` shared/lib/ocr.ts — Tesseract in a Worker, lazy, on the cropped rect only. *(tasks 011 g3; spec RULE-19)*
- `g4` Confidence gate at 0.70: below it the highlight is needs-correction and excluded from any Result until a human accepts it. *(tasks 011 g4)*
- `g5` Storybook stories incl. ManyStrokes (≥200 points) and DarkTheme. *(tasks 011 g5; ffa §10)*

**Gate —** A scanned page yields a usable highlight; ink stays at 60 fps with 200 points.
**Blocks —** [`021`](todo-task-021-leader-import.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q5 | defaulted | Storybook stories for canvas leaves | g5 stories |
| Q8 | **unanswered** | — | stylus behaviour differs by tablet |
| Q9 | **unanswered** | assume a pen; verify | pen assumed; finger must still work |

---

## 4. Where the work lands

```
src/shared/components/canvas/{marquee,highlight-layer}/ (+ painters)
src/shared/lib/ocr.ts
src/features/highlight/
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- painter lifecycle via its hook
- confidence gate boundary
- ManyStrokes / DarkTheme stories

---

## 6. Hand-offs

- 021 reuses the mask → crop → OCR path

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/011-task-region-highlight-and-ocr/task.json`

```json
{
  "id": "011-task-region-highlight-and-ocr",
  "title": "Pages with no text layer can still be marked, with confidence-gated OCR text",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["009-task-pdf-canvas"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 011"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, RULE-19"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §7"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5.2, §10"},
    {"doc": "todo-task-011-region-highlight-and-ocr.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "marquee + freehand ink leaves with a *.painter.ts — refs, rAF, batchDraw; the only imperative Konva files", "plan_ref": "tasks 011 g1; fa §6.1", "status": "pending"},
    {"id": "g2", "description": "Stylus: Pointer Events, pointerType==='pen' palm rejection, touch-action:none only while a draw tool is active", "plan_ref": "tasks 011 g2; fa §7", "status": "pending"},
    {"id": "g3", "description": "shared/lib/ocr.ts — Tesseract in a Worker, lazy, on the cropped rect only", "plan_ref": "tasks 011 g3; spec RULE-19", "status": "pending"},
    {"id": "g4", "description": "Confidence gate at 0.70: below it the highlight is needs-correction and excluded from any Result until a human accepts it", "plan_ref": "tasks 011 g4", "status": "pending"},
    {"id": "g5", "description": "Storybook stories incl. ManyStrokes (≥200 points) and DarkTheme", "plan_ref": "tasks 011 g5; ffa §10", "status": "pending"}
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
  "task_id": "011-task-region-highlight-and-ocr",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 011"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, RULE-19"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §7"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5.2, §10"},
    {"doc": "todo-task-011-region-highlight-and-ocr.md", "section": "full file"}
  ],
  "scope": "Region and freehand capture, stylus handling, cropped OCR, the confidence gate. Out of scope: Rasterize ink for Tesseract. OCR a whole page.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "I17 and I18 pass."},
    {"goal_id": "g2", "text": "Scrolling works whenever no draw tool is active."},
    {"goal_id": "g3", "text": "No whole-page OCR call exists."},
    {"goal_id": "g4", "text": "A 0.69 highlight is excluded from result input."},
    {"goal_id": "g5", "text": "Both stories render in the story test run."}
  ],
  "open_questions": ["Q5 (defaulted: Storybook stories for canvas leaves) — g5 stories.", "Q8 (unanswered) — stylus behaviour differs by tablet.", "Q9 (unanswered: assume a pen; verify) — pen assumed; finger must still work."],
  "risks": ["Stroke points in React state drop frames (fa §3).", "motion on a Konva node (I20).", "OCR on handwriting is weak — the gate protects the Result, not the note."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "011-task-region-highlight-and-ocr",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 011", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4, RULE-19", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §7", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5.2, §10", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/011-todo-region-highlight-and-ocr/contract.json`:

```json
{
  "id": "011-todo-region-highlight-and-ocr",
  "name": "Region highlight and OCR",
  "goal": "Pages with no text layer can still be marked, with confidence-gated OCR text.",
  "todo_path": "agent-thinking/todo/011-todo-region-highlight-and-ocr/contract.json",
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

`06-whole-apps-task.md` PHASE D · 011, `01-thinkboard-lite-spec.md` §5.4, RULE-19, `03-frontend-architecture.md` §6.1, §7, `04-frontend-folder-architecture.md` §5.2, §10. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
