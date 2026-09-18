---
doc_id: thinkboard-lite-task-009
title: Task 009 — PDF canvas
version: "1.0"
status: proposed
updated: 2026-09-18
task: "009"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 009 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 009 — PDF canvas

`009-task-pdf-canvas` · `frontend` · phase D — Frontend features · depends on [`003`](todo-task-003-types-and-seed.md), [`008`](todo-task-008-auth-and-workspace-shell.md) · blocks [`010`](todo-task-010-text-highlight.md), [`011`](todo-task-011-region-highlight-and-ocr.md)

**Main goal —** The workspace PDF renders, pans and zooms smoothly on a tablet.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 009 only. |
| **Do not** | Put the page inside a Konva scene (text becomes pixels). Store viewport pixels anywhere. |

---

## 1. What can go wrong

- 200 live Stages is an out-of-memory crash that looks like a Konva bug (hazard 7).
- react-konva touches window at import — every canvas file 'use client' (I24).
- OPFS eviction — re-fetch and notice (v2 §2.6).

---

## 2. Goals and gate

- `g1` shared/lib/pdf.ts seam; download from Storage once, cache bytes in OPFS (keyed per profile, F6); navigator.storage.persist(). *(tasks 009 g1; spec §5.3; split F6)*
- `g2` Page windowing: render ±1 page, unmount Konva Stages outside the window. *(tasks 009 g2; fa §6.2)*
- `g3` page-stage canvas leaf — z0 PDF canvas, z1 text layer, z2 Konva Stage, z3 DOM overlay. *(tasks 009 g3; fa §6.1)*
- `g4` Viewport slice: zoom, page cursor, rotation; pinch-zoom and two-finger pan via Pointer Events. *(tasks 009 g4; fa §7)*
- `g5` shared/utils/geometry.ts — normalize / denormalize page-relative rects, with tests. *(tasks 009 g5; spec RULE-17)*

**Gate —** A 30-page PDF scrolls at 60 fps on the pilot tablet; memory flat while scrolling.
**Blocks —** [`010`](todo-task-010-text-highlight.md), [`011`](todo-task-011-region-highlight-and-ocr.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q4 | defaulted | canvas leaves are a third shared tier | page-stage is a shared canvas leaf |
| D-10 | defaulted | group document not cached offline | the leader's note copy is not cached by default |
| Q8 | **unanswered** | — | the 60 fps gate is measured on the real tablet mix |

---

## 4. Where the work lands

```
src/shared/lib/{pdf,opfs}.ts
src/shared/components/canvas/page-stage/
src/features/document/
src/shared/utils/geometry.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- geometry round trip
- windowing mount count
- OPFS cache hit / eviction re-fetch

---

## 6. Hand-offs

- 010 captures text over z1
- 011 draws over z2

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/009-task-pdf-canvas/task.json`

```json
{
  "id": "009-task-pdf-canvas",
  "title": "The workspace PDF renders, pans and zooms smoothly on a tablet",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["003-task-types-and-seed", "008-task-auth-and-workspace-shell"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 009"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §6.2, §7"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §5.4"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5.2, §11"},
    {"doc": "todo-task-009-pdf-canvas.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "shared/lib/pdf.ts seam; download from Storage once, cache bytes in OPFS (keyed per profile, F6); navigator.storage.persist()", "plan_ref": "tasks 009 g1; spec §5.3; split F6", "status": "pending"},
    {"id": "g2", "description": "Page windowing: render ±1 page, unmount Konva Stages outside the window", "plan_ref": "tasks 009 g2; fa §6.2", "status": "pending"},
    {"id": "g3", "description": "page-stage canvas leaf — z0 PDF canvas, z1 text layer, z2 Konva Stage, z3 DOM overlay", "plan_ref": "tasks 009 g3; fa §6.1", "status": "pending"},
    {"id": "g4", "description": "Viewport slice: zoom, page cursor, rotation; pinch-zoom and two-finger pan via Pointer Events", "plan_ref": "tasks 009 g4; fa §7", "status": "pending"},
    {"id": "g5", "description": "shared/utils/geometry.ts — normalize / denormalize page-relative rects, with tests", "plan_ref": "tasks 009 g5; spec RULE-17", "status": "pending"}
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
  "task_id": "009-task-pdf-canvas",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 009"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §6.2, §7"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §5.4"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5.2, §11"},
    {"doc": "todo-task-009-pdf-canvas.md", "section": "full file"}
  ],
  "scope": "PDF load, OPFS cache, windowing, the page-stage leaf, viewport, geometry. Out of scope: Put the page inside a Konva scene (text becomes pixels). Store viewport pixels anywhere.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Second open reads OPFS with no network."},
    {"goal_id": "g2", "text": "A 30-page document never has more than three Stages mounted."},
    {"goal_id": "g3", "text": "Text in z1 is selectable above the canvas."},
    {"goal_id": "g4", "text": "Pinch and pan work with touch and pen."},
    {"goal_id": "g5", "text": "Round trip at three zooms and four rotations is exact."}
  ],
  "open_questions": ["Q4 (defaulted: canvas leaves are a third shared tier) — page-stage is a shared canvas leaf.", "D-10 (defaulted: group document not cached offline) — the leader's note copy is not cached by default.", "Q8 (unanswered) — the 60 fps gate is measured on the real tablet mix."],
  "risks": ["200 live Stages is an out-of-memory crash that looks like a Konva bug (hazard 7).", "react-konva touches window at import — every canvas file 'use client' (I24).", "OPFS eviction — re-fetch and notice (v2 §2.6)."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "009-task-pdf-canvas",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 009", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §6.2, §7", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §5.4", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5.2, §11", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/009-todo-pdf-canvas/contract.json`:

```json
{
  "id": "009-todo-pdf-canvas",
  "name": "PDF canvas",
  "goal": "The workspace PDF renders, pans and zooms smoothly on a tablet.",
  "todo_path": "agent-thinking/todo/009-todo-pdf-canvas/contract.json",
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

`06-whole-apps-task.md` PHASE D · 009, `03-frontend-architecture.md` §6.1, §6.2, §7, `01-thinkboard-lite-spec.md` §5.3, §5.4, `04-frontend-folder-architecture.md` §5.2, §11. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
