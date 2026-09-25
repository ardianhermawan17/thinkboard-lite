---
doc_id: thinkboard-lite-task-028
title: Task 028 — Presence rail
version: "1.0"
status: proposed
updated: 2026-09-26
task: "028"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-015-realtime-presence.md"]
authority: "Scope and contract for task 028 only."
---

# Task 028 — Presence rail

`028-task-presence-rail` · `frontend` · phase G — Integration · depends on [`015`](todo-task-015-realtime-presence.md), [`026`](todo-task-026-workspace-context.md) · blocks — (makes 015 g1/g4 visible)

**Main goal —** Who is here, and the "Leader is drawing" indicator, are visible in the document view.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Do not** | Open a live channel with an empty session id. Paint peer cursors here (separate follow-up; needs page geometry). |

---

## 1. What can go wrong

- `usePresence` opening a `live:` channel before a session is known — guard it.
- The rail drifting into a second source of truth for the leader — read the members meta (the roster already knows).

---

## 2. Goals and gate

- `g1` `usePresence` is inert without ids.
- `g2` the `presence-rail` container (peer count + leader indicator).
- `g3` mounted in the app document composition.
- `g4` hook + component tests.

**Gate —** two browsers see each other and the leader badge appears while the leader draws. (Live; canvas cursor painting is a follow-up.)

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| Q8 | unanswered | the frame budget stays 015's follow-up |
| D-11 | defaulted | the rail is a compact header-area affordance |

---

## 4. Where the work lands

```
src/features/presence/components/presence-rail/
src/features/presence/use-presence.ts   (guard when ids are missing)
src/app/w/[workspaceId]/workspace-document.tsx  (mount the rail)
```

---

## 5. Tests that must exist

- the rail hook resolves the leader and exposes peers/leaderDrawing
- the component shows "only you" with no peers and the leader badge when drawing

---

## 6. Hand-offs

- 015's peer-cursor canvas painting remains a follow-up.

---

## 7. Contract scaffolding

### 7.1 `agent-history/028-task-presence-rail/task.json`

```json
{
  "id": "028-task-presence-rail",
  "title": "The workspace shows who is here and raises the Leader-is-drawing indicator",
  "architecture": "frontend",
  "secondary_architecture": ["supabase"],
  "created_at": "2026-09-26T00:00:00Z",
  "status": "pending",
  "depends_on": ["015-task-realtime-presence", "026-task-workspace-context"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 028"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-03"},
    {"doc": "todo-task-028-presence-rail.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "usePresence does not open the live channel without a session/profile in context", "plan_ref": "tasks 028 g1", "status": "pending"},
    {"id": "g2", "description": "a presence-rail container showing the peer count and the leader indicator", "plan_ref": "tasks 028 g2", "status": "pending"},
    {"id": "g3", "description": "the app document composition renders the rail", "plan_ref": "tasks 028 g3", "status": "pending"},
    {"id": "g4", "description": "hook and component tests", "plan_ref": "tasks 028 g4", "status": "pending"}
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
  "task_id": "028-task-presence-rail",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 028"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2"},
    {"doc": "todo-task-028-presence-rail.md", "section": "full file"}
  ],
  "scope": "Guard usePresence, the rail container and its mount. Out of scope: painting peer cursors on the canvas (needs page geometry).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "No channel opens when sessionId/profileId are absent."},
    {"goal_id": "g2", "text": "The rail shows the peer count and the leader badge."},
    {"goal_id": "g3", "text": "The document composition renders the rail."},
    {"goal_id": "g4", "text": "Hook and component tests pass."}
  ],
  "open_questions": ["The leader id comes from the members meta; a second source would drift.", "Q8/D-11 defaulted/unanswered as in 015."],
  "risks": ["Opening a live channel with empty ids; a second leader source."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "028-task-presence-rail",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 028", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "028-todo-presence-rail",
  "name": "Presence rail",
  "goal": "The workspace shows who is here and raises the Leader-is-drawing indicator.",
  "todo_path": "agent-thinking/todo/028-todo-presence-rail/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · **no git write without explicit confirmation** · `npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 028, `01-thinkboard-lite-spec.md` §5.2, `todo-task-015-realtime-presence.md`.
