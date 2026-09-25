---
doc_id: thinkboard-lite-task-026
title: Task 026 — Workspace context and the note panel
version: "1.0"
status: proposed
updated: 2026-09-25
task: "026"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["04-frontend-folder-architecture.md"]
authority: "Scope and contract for task 026 only. Process law stays in 07-agent-working.md."
---

# Task 026 — Workspace context and the note panel

`026-task-workspace-context` · `frontend` · phase G — Integration · depends on [`025`](todo-task-025-wire-document-view.md) · blocks — (it unblocks the remaining mounts)

**Main goal —** A shared workspace context hands `profileId`/`sessionId` to any feature, and its first consumer — the note panel — mounts 012's note sheet.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Starts when** | 025 is done (it is). |
| **On conflict** | `07-agent-working.md` on process, `04-frontend-folder-architecture.md` on placement. |
| **Do not** | Import `@feature/workspace` from `features/notes` (I3). Use a store hook under `src/app` (I4). Add a fifth endpoint or a new folder outside the four locations. |

---

## 1. What can go wrong

- A context defined inside `features/workspace` cannot be imported by `features/notes` (I3); it must live in `shared/`.
- A note panel that reads `profileId` from the workspace slice directly duplicates a selector fact; the context is the one home.

---

## 2. Goals and gate

- `g1` a shared `WorkspaceProvider` / `useWorkspaceContext` (`profileId`, `sessionId`) provided by the workspace shell.
- `g2` `use-highlights-for-session` in `entities/queries`.
- `g3` a `note-panel` container listing the session's highlights and opening 012's `NoteSheet` for the selected one, `profileId` from the context.
- `g4` the app document composition renders the note panel beside the document.

**Gate —** with a seeded workspace, `/w/<id>` lists the highlights and opening one lets the author write a note.

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| D-11 | defaulted | the panel is a desktop/tablet affordance; mobile placement waits for 022 |
| Q11 | defaulted | the sheet docks ≥1280, overlays below (012's note sheet already owns this) |

Note: 012 and 015 remain open only for hardware/live goals; their **components are built** and this task consumes them. Recorded in `analyze.json.open_questions`, not silently assumed.

---

## 4. Where the work lands

```
src/shared/providers/workspace-provider/     # the seam (defined in shared/)
src/features/entities/queries/use-highlights-for-session.ts
src/features/notes/components/note-panel/    # the first consumer
src/features/workspace/…/workspace-shell/    # provides the value
src/app/w/[workspaceId]/workspace-document.tsx  # renders the panel
```

---

## 5. Tests that must exist

- the context hook throws outside a provider and returns the value inside one
- the note panel lists highlights and selects one; the author's note is picked
- the app composition renders the panel

---

## 6. Hand-offs

- 015's cursors and 021's import review mount against the same context next.

---

## 7. Contract scaffolding

### 7.1 `agent-history/026-task-workspace-context/task.json`

```json
{
  "id": "026-task-workspace-context",
  "title": "A shared workspace context hands profileId/sessionId to any feature, and the note panel mounts the note sheet",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-25T00:00:00Z",
  "status": "pending",
  "depends_on": ["025-task-wire-document-view"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 026"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5, §9"},
    {"doc": "todo-task-026-workspace-context.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "a shared WorkspaceProvider/useWorkspaceContext (profileId, sessionId) provided by the workspace shell", "plan_ref": "tasks 026 g1", "status": "pending"},
    {"id": "g2", "description": "use-highlights-for-session in entities/queries", "plan_ref": "tasks 026 g2", "status": "pending"},
    {"id": "g3", "description": "a note-panel container listing the session's highlights and opening 012's NoteSheet for the selected one, profileId from the context", "plan_ref": "tasks 026 g3", "status": "pending"},
    {"id": "g4", "description": "the app document composition renders the note panel beside the document", "plan_ref": "tasks 026 g4", "status": "pending"}
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
  "task_id": "026-task-workspace-context",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 026"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5, §9"},
    {"doc": "todo-task-026-workspace-context.md", "section": "full file"}
  ],
  "scope": "The shared workspace context, the session-wide highlights read, the note panel and its mount. Out of scope: mounting cursors or the import review (the same context enables them next).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Outside a provider the hook throws; inside it returns profileId/sessionId."},
    {"goal_id": "g2", "text": "The query returns the session's highlights across its artifacts."},
    {"goal_id": "g3", "text": "Selecting a highlight opens the sheet with the author's note."},
    {"goal_id": "g4", "text": "The document composition renders the panel."}
  ],
  "open_questions": ["012/015 are open only for hardware/live goals while their components are built; 026 consumes the components.", "D-11/Q11 defaulted."],
  "risks": ["A context defined in a feature would break I3; it must live in shared/.", "A direct workspace-slice read would duplicate a selector fact."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "026-task-workspace-context",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 026", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§5, §9", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "026-todo-workspace-context",
  "name": "Workspace context and the note panel",
  "goal": "A shared workspace context hands profileId/sessionId to any feature, and the note panel mounts the note sheet.",
  "todo_path": "agent-thinking/todo/026-todo-workspace-context/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · **no git write without explicit confirmation, every time** · `npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 026, `04-frontend-folder-architecture.md` §5, §9, `task-review-2026-09-25.md` (the layering note).
