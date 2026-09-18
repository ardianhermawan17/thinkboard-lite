---
doc_id: thinkboard-lite-task-012
title: Task 012 — Notes and handwriting
version: "1.0"
status: proposed
updated: 2026-09-18
task: "012"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 012 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 012 — Notes and handwriting

`012-task-notes-and-handwriting` · `frontend` · phase D — Frontend features · depends on [`010`](todo-task-010-text-highlight.md) · blocks [`013`](todo-task-013-sheets-and-promotion.md), [`024`](todo-task-024-ink-fallback.md)

**Main goal —** A focus point can carry a note, typed or handwritten, and handwriting produces text with no model and no network.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | Q7's 45-minute device test should already have run before task 000 closed (split §6); g6 records it formally. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 012 only. |
| **Do not** | Use contenteditable, Tiptap, Slate, ProseMirror or Lexical. Call a model to save a note. Build the ink pad here (024). |

---

## 1. What can go wrong

- Scribble does not list Bahasa Indonesia (v2 §3.4) — the single biggest risk in handwriting.
- A lazily mounted textarea misses the pen-down (v2 §3.3 #4).
- An LLM call on the save path (I28).

---

## 2. Goals and gate

- `g1` note-editor with two tabs — Ketik and Tulis tangan — both writing the same content field. *(tasks 012 g1; v2 §3.6)*
- `g2` The handwriting tab is a plain <textarea> styled as ruled paper: ≥20px, line-height ≈2.4, spellCheck={false}, ~16px clear padding, no contenteditable, no rich-text library. *(tasks 012 g2; v2 §3.3 I26)*
- `g3` Layout: the note sheet has its own stacking context and an opaque background; the Konva Stage beneath is pointer-events:none while it is open. *(tasks 012 g3; v2 §3.3 I27)*
- `g4` writing-check — a one-time practice box per device; result in meta.handwriting (os / unavailable); per-platform enable instructions. *(tasks 012 g4)*
- `g5` Autosave debounced 800 ms, coalesced into one outbox op; input_mode records keyboard / stylus_os. *(tasks 012 g5; db §8.1)*
- `g6` Run the device test (v2 §3.4) on the pilot's real tablets, in Indonesian; record the result in validate.json. *(tasks 012 g6; v2 §3.4)*
- `g7` I27 as a named Playwright story test — the invariant task 000 deferred here. *(split §4 I27)*

**Gate —** Three users write real Indonesian notes with a stylus on their own tablets and the text is usable. `g6` decides whether task 024 exists at all.
**Blocks —** [`013`](todo-task-013-sheets-and-promotion.md), [`024`](todo-task-024-ink-fallback.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q7 | **unanswered** | run the 45-minute device test | **unanswered** — g6 answers it |
| Q8 | **unanswered** | — | **unanswered** — test on the real mix |
| Q9 | **unanswered** | assume a pen; verify | **unanswered** — g6 reveals it |
| Q11 | defaulted | dock ≥1280, overlay below | sheet docks ≥1280, overlays below |
| C6 | **awaiting human sign-off** (split §3) | three-value enum | input_mode stylus_os exists |

---

## 4. Where the work lands

```
src/features/notes/components/{note-editor,writing-check}/
src/features/notes/{stores,selectors,types}/
src/shared/lib/handwriting.ts   # capability detector (v2 §4)
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- I26 lint, I27 story test, I28 grep
- coalesced autosave
- the device test (manual, recorded)

---

## 6. Hand-offs

- 013 shows notes in the sheets
- 024 exists only if g6 fails

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/012-task-notes-and-handwriting/task.json`

```json
{
  "id": "012-task-notes-and-handwriting",
  "title": "A focus point can carry a note, typed or handwritten, and handwriting produces text with no model and no network",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["010-task-text-highlight"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 012"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§3, §4, §6"},
    {"doc": "todo-task-000-split.md", "section": "§4 I26-I28, §6"},
    {"doc": "02-database-architecture.md", "section": "§4, §8.1"},
    {"doc": "todo-task-012-notes-and-handwriting.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "note-editor with two tabs — Ketik and Tulis tangan — both writing the same content field", "plan_ref": "tasks 012 g1; v2 §3.6", "status": "pending"},
    {"id": "g2", "description": "The handwriting tab is a plain <textarea> styled as ruled paper: ≥20px, line-height ≈2.4, spellCheck={false}, ~16px clear padding, no contenteditable, no rich-text library", "plan_ref": "tasks 012 g2; v2 §3.3 I26", "status": "pending"},
    {"id": "g3", "description": "Layout: the note sheet has its own stacking context and an opaque background; the Konva Stage beneath is pointer-events:none while it is open", "plan_ref": "tasks 012 g3; v2 §3.3 I27", "status": "pending"},
    {"id": "g4", "description": "writing-check — a one-time practice box per device; result in meta.handwriting (os / unavailable); per-platform enable instructions", "plan_ref": "tasks 012 g4", "status": "pending"},
    {"id": "g5", "description": "Autosave debounced 800 ms, coalesced into one outbox op; input_mode records keyboard / stylus_os", "plan_ref": "tasks 012 g5; db §8.1", "status": "pending"},
    {"id": "g6", "description": "Run the device test (v2 §3.4) on the pilot's real tablets, in Indonesian; record the result in validate.json", "plan_ref": "tasks 012 g6; v2 §3.4", "status": "pending"},
    {"id": "g7", "description": "I27 as a named Playwright story test — the invariant task 000 deferred here", "plan_ref": "split §4 I27", "status": "pending"}
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
  "task_id": "012-task-notes-and-handwriting",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 012"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§3, §4, §6"},
    {"doc": "todo-task-000-split.md", "section": "§4 I26-I28, §6"},
    {"doc": "02-database-architecture.md", "section": "§4, §8.1"},
    {"doc": "todo-task-012-notes-and-handwriting.md", "section": "full file"}
  ],
  "scope": "The note editor, the handwriting textarea, the writing check, autosave, the device test. Out of scope: Use contenteditable, Tiptap, Slate, ProseMirror or Lexical. Call a model to save a note. Build the ink pad here (024).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Switching tabs never loses text."},
    {"goal_id": "g2", "text": "I26 passes."},
    {"goal_id": "g3", "text": "Nothing interactive overlaps the textarea + 16px."},
    {"goal_id": "g4", "text": "The check runs once per device."},
    {"goal_id": "g5", "text": "Typing a paragraph yields one pending update."},
    {"goal_id": "g6", "text": "validate.json holds the three users' results; the outcome decides task 024."},
    {"goal_id": "g7", "text": "The story test fails if a Stage overlaps the open sheet."}
  ],
  "open_questions": ["Q7 (unanswered: run the 45-minute device test) — unanswered — g6 answers it.", "Q8 (unanswered) — unanswered — test on the real mix.", "Q9 (unanswered: assume a pen; verify) — unanswered — g6 reveals it.", "Q11 (defaulted: dock ≥1280, overlay below) — sheet docks ≥1280, overlays below.", "C6 — input_mode stylus_os exists."],
  "risks": ["Scribble does not list Bahasa Indonesia (v2 §3.4) — the single biggest risk in handwriting.", "A lazily mounted textarea misses the pen-down (v2 §3.3 #4).", "An LLM call on the save path (I28)."]
}
```

### 7.3 `validate.json` — 7 goal checks, no exceptions

```json
{
  "task_id": "012-task-notes-and-handwriting",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""},
    {"goal_id": "g6", "status": "", "notes": ""},
    {"goal_id": "g7", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 012", "result": ""},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§3, §4, §6", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§4 I26-I28, §6", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§4, §8.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/012-todo-notes-and-handwriting/contract.json`:

```json
{
  "id": "012-todo-notes-and-handwriting",
  "name": "Notes and handwriting",
  "goal": "A focus point can carry a note, typed or handwritten, and handwriting produces text with no model and no network.",
  "todo_path": "agent-thinking/todo/012-todo-notes-and-handwriting/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **7 here** · anything
touching RLS or stage transitions cannot reach validate with `test.json.summary.total: 0` · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every
time** (`09-agent-limitation.md` §1), on the shadow branch, never `master` · `npm run verify` green before a
frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE D · 012, `05-frontend-sync-handwriting.md` §3, §4, §6, `todo-task-000-split.md` §4 I26-I28, §6, `02-database-architecture.md` §4, §8.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
