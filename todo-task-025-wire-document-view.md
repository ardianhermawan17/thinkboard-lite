---
doc_id: thinkboard-lite-task-025
title: Task 025 — Wire the document view
version: "1.0"
status: proposed
updated: 2026-09-25
task: "025"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["04-frontend-folder-architecture.md", "03-frontend-architecture.md"]
authority: "Scope and contract for task 025 only. Process law stays in 07-agent-working.md."
---

# Task 025 — Wire the document view

`025-task-wire-document-view` · `frontend` · phase G — Integration · depends on [`008`](todo-task-008-auth-and-workspace-shell.md), [`009`](todo-task-009-pdf-canvas.md), [`010`](todo-task-010-text-highlight.md), [`011`](todo-task-011-region-highlight-and-ocr.md) · blocks — (it makes them visible)

**Main goal —** The workspace document view is mounted at `/w/[workspaceId]`, so the built highlight/region surfaces are user-visible.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Starts when** | 008, 009, 010, 011 are done (all are). |
| **On conflict** | `07-agent-working.md` on process, `04-frontend-folder-architecture.md` on placement. |
| **Do not** | Import `@feature/highlight` from `features/workspace` or `features/document` (I3). Use a store selector or dispatch under `src/app/` (I4). Invent a route. |

---

## 1. What can go wrong

- Composing `document` + `highlight` inside a feature violates I3; the composition belongs at the app route.
- An app-route component that dispatches or selects violates I4; it may hold only local UI state (the armed tool).

---

## 2. Goals and gate

- `g1` `WorkspaceShell` renders a document view in its main area instead of the placeholder, injected by the app route.
- `g2` `DocumentViewer` composes `HighlightedPage` through `renderPage`, app-level, with no store hook in the app component.
- `g3` a region-tool control (off / rectangle / freehand) arms the marquee.
- `g4` a composition test proves the wiring without a live stack.

**Gate —** with a seeded workspace, `/w/<sessionId>` shows the PDF; selecting text persists a highlight; a region tool persists one.

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| D-11 | defaulted | desktop/tablet authoring; the toolbar lives in the document header |
| Q8 | unanswered | not needed for the wiring; the on-device frame check stays 009/011's follow-up |

Every row goes into `analyze.json.open_questions`.

---

## 4. Where the work lands

```
src/app/w/[workspaceId]/{page.tsx, workspace-document.tsx}   # the composition point (I3/I4)
src/features/workspace/components/workspace-shell/           # an injected-children slot in <main>
```

The app-level component may import `@feature/document` and `@feature/highlight`; no feature imports another feature except `entities`/`sync` (I3).

---

## 5. Tests that must exist

- composition: `DocumentViewer` is given a `renderPage` that returns `HighlightedPage`, and the tool state arms the marquee
- the shell renders injected children in its main area

---

## 6. Hand-offs

- 012's `NoteSheet`, 015's `PeerCursors` and 021's `ImportReview` mount into this view next.

---

## 7. Contract scaffolding

### 7.1 `agent-history/025-task-wire-document-view/task.json`

```json
{
  "id": "025-task-wire-document-view",
  "title": "The workspace document view is mounted, so built highlight and capture surfaces are user-visible",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-25T00:00:00Z",
  "status": "pending",
  "depends_on": ["009-task-pdf-canvas", "010-task-text-highlight", "011-task-region-highlight-and-ocr"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 025"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3.1, §9"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §7"},
    {"doc": "todo-task-025-wire-document-view.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "WorkspaceShell renders an injected document view in its main area instead of the placeholder", "plan_ref": "tasks 025 g1", "status": "pending"},
    {"id": "g2", "description": "DocumentViewer composes HighlightedPage through renderPage at the app level; no store hook under src/app (I4)", "plan_ref": "tasks 025 g2; ffa §9", "status": "pending"},
    {"id": "g3", "description": "a region-tool control (off / rectangle / freehand) arms the marquee", "plan_ref": "tasks 025 g3", "status": "pending"},
    {"id": "g4", "description": "a composition test proves the wiring without a live stack", "plan_ref": "tasks 025 g4", "status": "pending"}
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
  "task_id": "025-task-wire-document-view",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 025"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3.1, §9"},
    {"doc": "03-frontend-architecture.md", "section": "§6.1, §7"},
    {"doc": "todo-task-025-wire-document-view.md", "section": "full file"}
  ],
  "scope": "Mount the document view: shell children slot, app-level DocumentViewer + HighlightedPage composition, the region-tool control. Out of scope: wiring the note sheet, presence cursors or the import review into the view.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "The shell's main area renders injected children."},
    {"goal_id": "g2", "text": "No useAppSelector/useAppDispatch under src/app."},
    {"goal_id": "g3", "text": "Choosing a tool changes the marquee's armed tool."},
    {"goal_id": "g4", "text": "A test renders the composition with mocks and asserts HighlightedPage receives the tool."}
  ],
  "open_questions": ["D-11 (defaulted) — the toolbar is desktop/tablet authoring UI.", "Q8 (unanswered) — the on-device frame check stays 009/011's follow-up."],
  "risks": ["I3: a feature importing document/highlight; the composition must stay app-level.", "I4: a store hook under src/app."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "025-task-wire-document-view",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 025", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3.1, §9", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

```json
{
  "id": "025-todo-wire-document-view",
  "name": "Wire the document view",
  "goal": "The workspace document view is mounted, so built highlight and capture surfaces are user-visible.",
  "todo_path": "agent-thinking/todo/025-todo-wire-document-view/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every time** ·
`npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 025, `04-frontend-folder-architecture.md` §3.1, §9, `03-frontend-architecture.md` §6.1, §7.
