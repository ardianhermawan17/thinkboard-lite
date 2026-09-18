---
doc_id: thinkboard-lite-task-008
title: Task 008 — Auth and workspace shell
version: "1.0"
status: proposed
updated: 2026-09-18
task: "008"
phase: "D — Frontend features"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 008 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 008 — Auth and workspace shell

`008-task-auth-and-workspace-shell` · `frontend` · phase D — Frontend features · depends on [`002`](todo-task-002-rls-access-proof.md), [`003`](todo-task-003-types-and-seed.md), [`005`](todo-task-005-design-system.md), [`006`](todo-task-006-entities-kernel.md) · blocks [`009`](todo-task-009-pdf-canvas.md)

**Main goal —** A user signs in and opens a workspace with a leader, a persona and a goal.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 008 only. |
| **Do not** | Fetch in a page.tsx. Put a secret key in the client. Branch on device outside useBreakpoint. |

---

## 1. What can go wrong

- Workspace create before task 017 exists: g2 must reach create_workspace without the POST /api/v1/workspaces endpoint — raise it (see §3).
- Reading teams / members live breaks RULE-07 — they come from Dexie meta (DB-Q12).

---

## 2. Goals and gate

- `g1` Supabase auth sign in / out with the publishable key; session cached locally so offline open needs no token refresh. *(tasks 008 g1; spec RULE-14)*
- `g2` Workspace create: team + board + column + session in one transaction via create_workspace (DB-Q6); the creator picks the leader. *(tasks 008 g2; db §10 DB-Q6)*
- `g3` Members list; leadership transfer. *(tasks 008 g3; spec D-09)*
- `g4` Workspace persona (leader) and personal persona (self) editors; one active persona per person. *(tasks 008 g4; spec D-04)*
- `g5` WorkspaceShell — document area, right rail, header with sync pill, mode switch, theme switch; app-header and auth-guard live in features/workspace. *(tasks 008 g5; ffa §9)*
- `g6` The workspace route is a client component loaded ssr:false; no SSR data dependency. *(tasks 008 g6; ffa §3.1)*

**Gate —** Sign in → create a workspace → land on the shell, against real RLS.
**Blocks —** [`009`](todo-task-009-pdf-canvas.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-04 | defaulted | one active persona per person | g4 |
| D-09 | defaulted | leadership transfers, by the leader or the creator | g3 |
| DB-Q6 | defaulted | `create_workspace` definer RPC; creator is leader | g2 — needs the confirmed RPC from 001 g7 |
| DB-Q12 | defaulted | non-mirrored tables pulled into Dexie `meta`; writes via outbox | members and teams read from meta |
| *new* | to raise | — | **raise:** spec §4.3 makes create-workspace a command endpoint (017), but 008 runs first. Default: call create_workspace as an outbox `rpc` op now; 017's endpoint wraps the same RPC. |

---

## 4. Where the work lands

```
src/app/{auth,w,w/[workspaceId]}/page.tsx
src/features/workspace/components/{workspace-shell,app-header,auth-guard,members,persona-editor}/
src/features/workspace/{stores,selectors,types}/
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- create-workspace atomicity
- offline reopen without refresh
- leader transfer keeps one leader

---

## 6. Hand-offs

- 009 mounts the PDF canvas in the shell's document area
- 013 fills the right rail

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/008-task-auth-and-workspace-shell/task.json`

```json
{
  "id": "008-task-auth-and-workspace-shell",
  "title": "A user signs in and opens a workspace with a leader, a persona and a goal",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["002-task-rls-access-proof", "003-task-types-and-seed", "005-task-design-system", "006-task-entities-kernel"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 008"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§2, §4.3, RULE-14, §10"},
    {"doc": "02-database-architecture.md", "section": "§3, §10"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3, §9"},
    {"doc": "todo-task-008-auth-and-workspace-shell.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Supabase auth sign in / out with the publishable key; session cached locally so offline open needs no token refresh", "plan_ref": "tasks 008 g1; spec RULE-14", "status": "pending"},
    {"id": "g2", "description": "Workspace create: team + board + column + session in one transaction via create_workspace (DB-Q6); the creator picks the leader", "plan_ref": "tasks 008 g2; db §10 DB-Q6", "status": "pending"},
    {"id": "g3", "description": "Members list; leadership transfer", "plan_ref": "tasks 008 g3; spec D-09", "status": "pending"},
    {"id": "g4", "description": "Workspace persona (leader) and personal persona (self) editors; one active persona per person", "plan_ref": "tasks 008 g4; spec D-04", "status": "pending"},
    {"id": "g5", "description": "WorkspaceShell — document area, right rail, header with sync pill, mode switch, theme switch; app-header and auth-guard live in features/workspace", "plan_ref": "tasks 008 g5; ffa §9", "status": "pending"},
    {"id": "g6", "description": "The workspace route is a client component loaded ssr:false; no SSR data dependency", "plan_ref": "tasks 008 g6; ffa §3.1", "status": "pending"}
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
  "task_id": "008-task-auth-and-workspace-shell",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 008"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§2, §4.3, RULE-14, §10"},
    {"doc": "02-database-architecture.md", "section": "§3, §10"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3, §9"},
    {"doc": "todo-task-008-auth-and-workspace-shell.md", "section": "full file"}
  ],
  "scope": "Auth, workspace creation, members, personas, and the one-screen shell. Out of scope: Fetch in a page.tsx. Put a secret key in the client. Branch on device outside useBreakpoint.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Airplane mode: reopen the app, land in the last workspace."},
    {"goal_id": "g2", "text": "A failed create leaves no partial rows."},
    {"goal_id": "g3", "text": "After transfer, team_members_one_leader still holds."},
    {"goal_id": "g4", "text": "A second active persona is rejected by the index."},
    {"goal_id": "g5", "text": "No shell component imports another context's internals."},
    {"goal_id": "g6", "text": "page.tsx contains only the dynamic import."}
  ],
  "open_questions": ["D-04 (defaulted: one active persona per person) — g4.", "D-09 (defaulted: leadership transfers, by the leader or the creator) — g3.", "DB-Q6 (defaulted: `create_workspace` definer RPC; creator is leader) — g2 — needs the confirmed RPC from 001 g7.", "DB-Q12 (defaulted: non-mirrored tables pulled into Dexie `meta`; writes via outbox) — members and teams read from meta.", "NEW, to raise: raise: spec §4.3 makes create-workspace a command endpoint (017), but 008 runs first. Default: call create_workspace as an outbox `rpc` op now; 017's endpoint wraps the same RPC."],
  "risks": ["Workspace create before task 017 exists: g2 must reach create_workspace without the POST /api/v1/workspaces endpoint — raise it (see §3).", "Reading teams / members live breaks RULE-07 — they come from Dexie meta (DB-Q12)."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "008-task-auth-and-workspace-shell",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""},
    {"goal_id": "g6", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE D · 008", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§2, §4.3, RULE-14, §10", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§3, §10", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§3, §9", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/008-todo-auth-and-workspace-shell/contract.json`:

```json
{
  "id": "008-todo-auth-and-workspace-shell",
  "name": "Auth and workspace shell",
  "goal": "A user signs in and opens a workspace with a leader, a persona and a goal.",
  "todo_path": "agent-thinking/todo/008-todo-auth-and-workspace-shell/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **6 here** · anything
touching RLS or stage transitions cannot reach validate with `test.json.summary.total: 0` · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every
time** (`09-agent-limitation.md` §1), on the shadow branch, never `master` · `npm run verify` green before a
frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE D · 008, `01-thinkboard-lite-spec.md` §2, §4.3, RULE-14, §10, `02-database-architecture.md` §3, §10, `04-frontend-folder-architecture.md` §3, §9. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
