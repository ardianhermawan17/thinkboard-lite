---
doc_id: thinkboard-lite-task-031
title: Task 031 — Peer cursors
version: "1.0"
status: proposed
updated: 2026-09-26
task: "031"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-015-realtime-presence.md", "todo-task-028-presence-rail.md"]
authority: "Scope and contract for task 031 only."
---

# Task 031 — Peer cursors

`031-task-peer-cursors` · `frontend` · phase G — Integration · depends on [`015`](todo-task-015-realtime-presence.md), [`026`](todo-task-026-workspace-context.md), [`028`](todo-task-028-presence-rail.md) · blocks — (closes 015 g2)

**Main goal —** Teammates see each other's pointer move on the page, and publish their own.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Do not** | Put cursors in React state or Redux (015 g2 / RULE-20). Open a second live channel. Send on `ws:`/`user:`. |

---

## 1. What can go wrong

- Two `usePresence` callers open two `live:` channels; the provider exists to prevent that.
- Raw pixels on the wire would break for a peer viewing at another zoom or rotation; the wire carries page-relative 0–1 (RULE-17).

---

## 2. Goals and gate

- `g1` one `PresenceProvider` owning the channel; rail + layer consume it.
- `g2` `PresenceLayer` paints incoming cursors via the leaf's ref/painter.
- `g3` the page publishes its pointer, throttled ~20 Hz, only on movement.
- `g4` tests.

**Gate —** two browsers see each other's pointer; latency ~100–300 ms (live).

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| RULE-20 | standing | refs + imperative paint; the throttle sends only on real movement |
| RULE-17 | standing | the wire carries page-relative 0–1; each client denormalizes with its own size/rotation |
| Q8 | unanswered | the frame budget stays 015's follow-up |

---

## 4. Where the work lands

```
src/features/presence/ (provider, context hook, presence-layer, use-presence cursor store)
src/shared/components/canvas/page-stage/ (an optional pointer callback)
src/features/highlight/components/highlighted-page/ (an overlay slot + pointer passthrough)
src/app/w/[workspaceId]/workspace-document.tsx (wrap in the provider; pass the layer + publisher)
```

---

## 5. Tests that must exist

- the provider opens one channel and exposes publish/subscribe
- the layer paints on an incoming cursor and clears on unmount
- publishing normalises through geometry and throttles

---

## 6. Hand-offs

- none; the live two-browser measurement is 015 g5.

---

## 7. Contract scaffolding

### 7.1 `agent-history/031-task-peer-cursors/task.json`

```json
{
  "id": "031-task-peer-cursors",
  "title": "A teammate's pointer is drawn on the page as it moves, and this client publishes its own",
  "architecture": "frontend",
  "secondary_architecture": ["supabase"],
  "created_at": "2026-09-26T00:00:00Z",
  "status": "pending",
  "depends_on": ["015-task-realtime-presence", "026-task-workspace-context", "028-task-presence-rail"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 031"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-17, RULE-20"},
    {"doc": "todo-task-031-peer-cursors.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "one PresenceProvider owns the single live channel and exposes peers/leader/cursor store", "plan_ref": "tasks 031 g1", "status": "pending"},
    {"id": "g2", "description": "PresenceLayer paints incoming cursors through the peer-cursors leaf (ref/painter only)", "plan_ref": "tasks 031 g2; RULE-20", "status": "pending"},
    {"id": "g3", "description": "the page publishes its own pointer, throttled ~20 Hz, only on real movement", "plan_ref": "tasks 031 g3; RULE-17", "status": "pending"},
    {"id": "g4", "description": "provider, layer and publish tests", "plan_ref": "tasks 031 g4", "status": "pending"}
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
  "task_id": "031-task-peer-cursors",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 031"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-17, RULE-20"},
    {"doc": "todo-task-031-peer-cursors.md", "section": "full file"}
  ],
  "scope": "The presence provider, the cursor layer, the pointer publish seam, and the page-stage/highlighted-page slots they need. Out of scope: any second channel; React state for cursors.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "One channel; rail and layer share it."},
    {"goal_id": "g2", "text": "Incoming cursors paint; unmount clears them."},
    {"goal_id": "g3", "text": "A pointer publishes page-relative coords once per interval and not on a repeat."},
    {"goal_id": "g4", "text": "Tests pass."}
  ],
  "open_questions": ["Q8 (frame budget) stays 015's follow-up.", "The wire is page-relative 0-1 (RULE-17); each client renders with its own size/rotation."],
  "risks": ["A second channel; pixels on the wire; cursors in React state."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "031-task-peer-cursors",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 031", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.2, RULE-17, RULE-20", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "031-todo-peer-cursors",
  "name": "Peer cursors",
  "goal": "A teammate's pointer is drawn on the page as it moves, and this client publishes its own.",
  "todo_path": "agent-thinking/todo/031-todo-peer-cursors/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · **no git write without explicit confirmation** · `npm run verify` green before a frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 031, `01-thinkboard-lite-spec.md` §5.2, RULE-17, RULE-20, `todo-task-015-realtime-presence.md`, `todo-task-028-presence-rail.md`.
