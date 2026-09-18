---
doc_id: thinkboard-lite-task-022
title: Task 022 — Responsive, motion and theme
version: "1.0"
status: proposed
updated: 2026-09-18
task: "022"
phase: "F — Hardening"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 022 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 022 — Responsive, motion and theme

`022-task-responsive-motion-theme` · `frontend` · phase F — Hardening · depends on — · blocks [`023`](todo-task-023-pilot-hardening.md)

**Main goal —** The product is right on the device 70% of users actually hold.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | The plan states no hard prerequisite. It polishes phase D, so start once the features it touches (008–013) are done; record that choice in analyze.json. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 022 only. |
| **Do not** | Branch on device outside useBreakpoint. Animate Konva with motion. |

---

## 1. What can go wrong

- motion and Konva tweening the same element — jank that is very hard to attribute (I20).

---

## 2. Goals and gate

- `g1` Device matrix: tablet authors, desktop analyses, mobile reads and writes notes; no freehand ink on mobile. *(tasks 022 g1; spec D-11)*
- `g2` Sheets: full-screen on mobile, right sheet on tablet, docked rail ≥1280. *(tasks 022 g2)*
- `g3` motion pass on DOM only; prefers-reduced-motion honoured everywhere; no motion import under components/canvas/. *(tasks 022 g3; fa §6.3 I20)*
- `g4` Dark mode: Konva colours passed into the Stage explicitly and redrawn on theme change; highlights keep hue and lose alpha. *(tasks 022 g4; spec §5.3)*
- `g5` Tablet pass on real hardware: tap targets, pen vs finger, keyboard-open layout. *(tasks 022 g5)*

**Gate —** A full session completed on the pilot tablet without reaching for a mouse.
**Blocks —** [`023`](todo-task-023-pilot-hardening.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-11 | defaulted | tablet authors, desktop analyses, mobile reads + writes notes; no ink on mobile | g1 |
| Q6 | defaulted | breakpoint hook + sheet early, mobile layout last | mobile layout lands here |
| Q8 | **unanswered** | — | the real tablet mix |

---

## 4. Where the work lands

```
src/features/*/components/ (layout pass)
src/shared/components/canvas/* (theme colours)
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- breakpoint snapshots
- reduced-motion
- theme redraw

---

## 6. Hand-offs

- 023 runs the pilot on the result

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/022-task-responsive-motion-theme/task.json`

```json
{
  "id": "022-task-responsive-motion-theme",
  "title": "The product is right on the device 70% of users actually hold",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": [],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 022"},
    {"doc": "03-frontend-architecture.md", "section": "§6.3, §7"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§4 device matrix"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §10"},
    {"doc": "todo-task-022-responsive-motion-theme.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Device matrix: tablet authors, desktop analyses, mobile reads and writes notes; no freehand ink on mobile", "plan_ref": "tasks 022 g1; spec D-11", "status": "pending"},
    {"id": "g2", "description": "Sheets: full-screen on mobile, right sheet on tablet, docked rail ≥1280", "plan_ref": "tasks 022 g2", "status": "pending"},
    {"id": "g3", "description": "motion pass on DOM only; prefers-reduced-motion honoured everywhere; no motion import under components/canvas/", "plan_ref": "tasks 022 g3; fa §6.3 I20", "status": "pending"},
    {"id": "g4", "description": "Dark mode: Konva colours passed into the Stage explicitly and redrawn on theme change; highlights keep hue and lose alpha", "plan_ref": "tasks 022 g4; spec §5.3", "status": "pending"},
    {"id": "g5", "description": "Tablet pass on real hardware: tap targets, pen vs finger, keyboard-open layout", "plan_ref": "tasks 022 g5", "status": "pending"}
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
  "task_id": "022-task-responsive-motion-theme",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 022"},
    {"doc": "03-frontend-architecture.md", "section": "§6.3, §7"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§4 device matrix"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §10"},
    {"doc": "todo-task-022-responsive-motion-theme.md", "section": "full file"}
  ],
  "scope": "Responsive matrix, motion pass, dark-mode canvas, tablet hardware pass. Out of scope: Branch on device outside useBreakpoint. Animate Konva with motion.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Ink tools are absent below 768px."},
    {"goal_id": "g2", "text": "Verified at 375, 768, 1280."},
    {"goal_id": "g3", "text": "I20 passes; reduced motion disables every transition."},
    {"goal_id": "g4", "text": "Theme switch redraws the Stage."},
    {"goal_id": "g5", "text": "Findings recorded in validate.json."}
  ],
  "open_questions": ["D-11 (defaulted: tablet authors, desktop analyses, mobile reads + writes notes; no ink on mobile) — g1.", "Q6 (defaulted: breakpoint hook + sheet early, mobile layout last) — mobile layout lands here.", "Q8 (unanswered) — the real tablet mix."],
  "risks": ["motion and Konva tweening the same element — jank that is very hard to attribute (I20)."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "022-task-responsive-motion-theme",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE F · 022", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§6.3, §7", "result": ""},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§4 device matrix", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.3, §10", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/022-todo-responsive-motion-theme/contract.json`:

```json
{
  "id": "022-todo-responsive-motion-theme",
  "name": "Responsive, motion and theme",
  "goal": "The product is right on the device 70% of users actually hold.",
  "todo_path": "agent-thinking/todo/022-todo-responsive-motion-theme/contract.json",
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

`06-whole-apps-task.md` PHASE F · 022, `03-frontend-architecture.md` §6.3, §7, `05-frontend-sync-handwriting.md` §4 device matrix, `01-thinkboard-lite-spec.md` §5.3, §10. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
