---
doc_id: thinkboard-lite-task-021
title: Task 021 — Leader import
version: "1.0"
status: proposed
updated: 2026-09-18
task: "021"
phase: "E — Backend"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 021 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 021 — Leader import

`021-task-leader-import` · `frontend` (secondary `backend`) · phase E — Backend · depends on [`010`](todo-task-010-text-highlight.md), [`011`](todo-task-011-region-highlight-and-ocr.md) · blocks —

**Main goal —** A leader drops in an already-highlighted PDF and every mark becomes a group focus point with a note and a slug.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | `010` is taken from the dependency graph (§2 of the task plan) as well as the stated `011`: rung 2 intersects text-layer items, which 010 builds. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 021 only. |
| **Do not** | Commit without review. OCR a page that has a text layer. |

---

## 1. What can go wrong

- The colour mask fires on charts and coloured table headers — the review screen is the mitigation.
- PDF rects are bottom-left, Y-up; skipping convertToViewportRectangle mirrors every mark.

---

## 2. Goals and gate

- `g1` Rung 1 first: page.getAnnotations() → subtype==='Highlight' → QuadPoints → convertToViewportRectangle(); multi-line quads flatten into one highlight with several rects. *(tasks 021 g1; spec §5.4)*
- `g2` Rung 2: flattened highlights — HSV colour mask, connected components, intersect with text-layer items for exact text. *(tasks 021 g2)*
- `g3` Rung 3: scans — same mask, crop, Tesseract, confidence gate. *(tasks 021 g3; spec RULE-19)*
- `g4` Review screen before commit — checkboxes and editable OCR text. *(tasks 021 g4)*
- `g5` Each accepted region → layer='group' highlight + empty note + slug, in one batch that teammates apply in one transaction (F5). *(tasks 021 g5; split F5)*

**Gate —** An Acrobat-annotated PDF imports with exact text and zero OCR calls.
**Blocks —** —.

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-02 | defaulted | one `main` PDF + the leader's `note` copy | the import is the note slot artifact |
| RULE-19 | standing rule (spec §3) | — | OCR last, crops only |

---

## 4. Where the work lands

```
src/features/highlight/components/import-review/
src/features/highlight/utils/ (mask, quads)
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- rung 1 exact import
- flattened-page mask
- batch apply

---

## 6. Hand-offs

- group highlights feed 020's group run

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/021-task-leader-import/task.json`

```json
{
  "id": "021-task-leader-import",
  "title": "A leader drops in an already-highlighted PDF and every mark becomes a group focus point with a note and a slug",
  "architecture": "frontend",
  "secondary_architecture": ["backend"],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["010-task-text-highlight", "011-task-region-highlight-and-ocr"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 021, §2"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4"},
    {"doc": "todo-task-000-split.md", "section": "§5.3 F5"},
    {"doc": "todo-task-021-leader-import.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Rung 1 first: page.getAnnotations() → subtype==='Highlight' → QuadPoints → convertToViewportRectangle(); multi-line quads flatten into one highlight with several rects", "plan_ref": "tasks 021 g1; spec §5.4", "status": "pending"},
    {"id": "g2", "description": "Rung 2: flattened highlights — HSV colour mask, connected components, intersect with text-layer items for exact text", "plan_ref": "tasks 021 g2", "status": "pending"},
    {"id": "g3", "description": "Rung 3: scans — same mask, crop, Tesseract, confidence gate", "plan_ref": "tasks 021 g3; spec RULE-19", "status": "pending"},
    {"id": "g4", "description": "Review screen before commit — checkboxes and editable OCR text", "plan_ref": "tasks 021 g4", "status": "pending"},
    {"id": "g5", "description": "Each accepted region → layer='group' highlight + empty note + slug, in one batch that teammates apply in one transaction (F5)", "plan_ref": "tasks 021 g5; split F5", "status": "pending"}
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
  "task_id": "021-task-leader-import",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 021, §2"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4"},
    {"doc": "todo-task-000-split.md", "section": "§5.3 F5"},
    {"doc": "todo-task-021-leader-import.md", "section": "full file"}
  ],
  "scope": "The three-rung import ladder, the review screen, the batch commit. Out of scope: Commit without review. OCR a page that has a text layer.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "An Acrobat-annotated page imports with zero OCR calls."},
    {"goal_id": "g2", "text": "Exact text on a flattened page with a text layer."},
    {"goal_id": "g3", "text": "OCR runs on crops only."},
    {"goal_id": "g4", "text": "Nothing commits without review."},
    {"goal_id": "g5", "text": "A 40-highlight import causes one Dexie transaction per client, not 80."}
  ],
  "open_questions": ["D-02 (defaulted: one `main` PDF + the leader's `note` copy) — the import is the note slot artifact.", "RULE-19 — OCR last, crops only."],
  "risks": ["The colour mask fires on charts and coloured table headers — the review screen is the mitigation.", "PDF rects are bottom-left, Y-up; skipping convertToViewportRectangle mirrors every mark."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "021-task-leader-import",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 021, §2", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.4", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§5.3 F5", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/021-todo-leader-import/contract.json`:

```json
{
  "id": "021-todo-leader-import",
  "name": "Leader import",
  "goal": "A leader drops in an already-highlighted PDF and every mark becomes a group focus point with a note and a slug.",
  "todo_path": "agent-thinking/todo/021-todo-leader-import/contract.json",
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

`06-whole-apps-task.md` PHASE E · 021, §2, `01-thinkboard-lite-spec.md` §5.4, `todo-task-000-split.md` §5.3 F5. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
