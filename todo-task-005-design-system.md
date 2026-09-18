---
doc_id: thinkboard-lite-task-005
title: Task 005 — Design system
version: "1.0"
status: proposed
updated: 2026-09-18
task: "005"
phase: "C — Frontend foundation"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 005 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 005 — Design system

`005-task-design-system` · `frontend` · phase C — Frontend foundation · depends on [`004`](todo-task-004-frontend-scaffold.md) · blocks [`008`](todo-task-008-auth-and-workspace-shell.md)

**Main goal —** Atoms, theme and the provider tree exist, so every later component composes rather than invents.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 005 only. |
| **Do not** | Add Zustand or TanStack Query. Branch on device anywhere but useBreakpoint. |

---

## 1. What can go wrong

- The persist whitelist growing an entities or reducerPath entry (I12, hazard 6).
- cn() comes from the `cn` package here, not clsx + tailwind-merge — do not add them back.
- Konva will not inherit these tokens; 009/022 pass colours explicitly.

---

## 2. Goals and gate

- `g1` shadcn add the atom set: button, input, textarea, sheet, dialog, tabs, card, skeleton, sonner, tooltip, switch. *(tasks 005 g1)*
- `g2` globals.css theme tokens; highlight colours as tokens for light AND dark (keep hue, drop alpha). *(tasks 005 g2; spec §5.3)*
- `g3` LibraryProvider in the fixed order Redux → PersistGate → Shadcn → Theme → Tooltip; Toaster mounted once. *(tasks 005 g3; ffa §3.3)*
- `g4` useBreakpoint() in shared/hooks — the only source of device branching. *(tasks 005 g4; fa §7)*
- `g5` stripUi persist transform + persistConfig + listenerMiddleware registered — the 4-point store edit. *(tasks 005 g5; fa §5.2, §5.3)*

**Gate —** The app boots light and dark; no hex colour under `shared/components`.
**Blocks —** [`008`](todo-task-008-auth-and-workspace-shell.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q6 | defaulted | breakpoint hook + sheet early, mobile layout last | useBreakpoint ships now, mobile layout later |
| D-11 | defaulted | tablet authors, desktop analyses, mobile reads + writes notes; no ink on mobile | the device classes useBreakpoint returns |
| C8 | resolved in split §3 | — | Redux Toolkit + redux-persist, no Zustand |

---

## 4. Where the work lands

```
src/shared/components/ui/*
src/app/globals.css
src/shared/providers/{index.tsx,redux-provider,shadcn-provider,theme-provider}
src/shared/hooks/use-breakpoint.ts
src/shared/config/redux/{store,hooks,listener,persist}.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- stripUi drops every slice's ui key
- useBreakpoint boundary values (767/768, 1279/1280)
- provider tree renders in both themes

---

## 6. Hand-offs

- 008's shell composes these atoms and providers
- 006/007 register into the store seam built here

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/005-task-design-system/task.json`

```json
{
  "id": "005-task-design-system",
  "title": "Atoms, theme and the provider tree exist, so every later component composes rather than invents",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["004-task-frontend-scaffold"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 005"},
    {"doc": "03-frontend-architecture.md", "section": "§5, §7, §8"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3.3, §5, §5.1"},
    {"doc": "todo-task-005-design-system.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "shadcn add the atom set: button, input, textarea, sheet, dialog, tabs, card, skeleton, sonner, tooltip, switch", "plan_ref": "tasks 005 g1", "status": "pending"},
    {"id": "g2", "description": "globals.css theme tokens; highlight colours as tokens for light AND dark (keep hue, drop alpha)", "plan_ref": "tasks 005 g2; spec §5.3", "status": "pending"},
    {"id": "g3", "description": "LibraryProvider in the fixed order Redux → PersistGate → Shadcn → Theme → Tooltip; Toaster mounted once", "plan_ref": "tasks 005 g3; ffa §3.3", "status": "pending"},
    {"id": "g4", "description": "useBreakpoint() in shared/hooks — the only source of device branching", "plan_ref": "tasks 005 g4; fa §7", "status": "pending"},
    {"id": "g5", "description": "stripUi persist transform + persistConfig + listenerMiddleware registered — the 4-point store edit", "plan_ref": "tasks 005 g5; fa §5.2, §5.3", "status": "pending"}
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
  "task_id": "005-task-design-system",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 005"},
    {"doc": "03-frontend-architecture.md", "section": "§5, §7, §8"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3.3, §5, §5.1"},
    {"doc": "todo-task-005-design-system.md", "section": "full file"}
  ],
  "scope": "Atoms, theme tokens, provider tree, breakpoint hook, the store seam. Out of scope: Add Zustand or TanStack Query. Branch on device anywhere but useBreakpoint.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "All eleven atoms under src/shared/components/ui, untouched except theme wiring."},
    {"goal_id": "g2", "text": "Every highlight colour has a light and a dark token."},
    {"goal_id": "g3", "text": "app/layout.tsx imports only LibraryProvider from shared/providers."},
    {"goal_id": "g4", "text": "No media query in any container."},
    {"goal_id": "g5", "text": "I12 and I16 pass; listenerMiddleware is prepended once."}
  ],
  "open_questions": ["Q6 (defaulted: breakpoint hook + sheet early, mobile layout last) — useBreakpoint ships now, mobile layout later.", "D-11 (defaulted: tablet authors, desktop analyses, mobile reads + writes notes; no ink on mobile) — the device classes useBreakpoint returns.", "C8 — Redux Toolkit + redux-persist, no Zustand."],
  "risks": ["The persist whitelist growing an entities or reducerPath entry (I12, hazard 6).", "cn() comes from the `cn` package here, not clsx + tailwind-merge — do not add them back.", "Konva will not inherit these tokens; 009/022 pass colours explicitly."]
}
```

### 7.3 `validate.json` — 5 goal checks, no exceptions

```json
{
  "task_id": "005-task-design-system",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 005", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§5, §7, §8", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3.3, §5, §5.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/005-todo-design-system/contract.json`:

```json
{
  "id": "005-todo-design-system",
  "name": "Design system",
  "goal": "Atoms, theme and the provider tree exist, so every later component composes rather than invents.",
  "todo_path": "agent-thinking/todo/005-todo-design-system/contract.json",
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

`06-whole-apps-task.md` PHASE C · 005, `03-frontend-architecture.md` §5, §7, §8, `04-frontend-folder-architecture.md` §3.3, §5, §5.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
