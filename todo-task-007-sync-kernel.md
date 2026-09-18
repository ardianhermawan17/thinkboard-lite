---
doc_id: thinkboard-lite-task-007
title: Task 007 — Sync kernel
version: "1.0"
status: proposed
updated: 2026-09-18
task: "007"
phase: "C — Frontend foundation"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 007 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 007 — Sync kernel

`007-task-sync-kernel` · `frontend` · phase C — Frontend foundation · depends on [`006`](todo-task-006-entities-kernel.md) · blocks [`015`](todo-task-015-realtime-presence.md), [`016`](todo-task-016-offline-and-export.md)

**Main goal —** Local writes reach Supabase and remote changes reach Dexie, so the app is correct online and offline before any feature depends on it.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 007 only. |
| **Do not** | Import @supabase/supabase-js anywhere but channel.ts and shared/lib/supabase.ts (I21). Retry a 4xx. Subscribe before reconcile. |

---

## 1. What can go wrong

- One of the two tasks most likely to overrun (tasks §4) — budget a spike.
- Honest size is 800-1200 lines with tests (split §5.1); the PowerSync escape hatch is keyed to behaviour, not line count.
- Missing setAuth() after refresh: delivery stops silently about an hour in (I22).
- Pull before push overwrites unsent local rows (RULE-13).

---

## 2. Goals and gate

- `g1` outbox/push.ts — drain in strict seq order, upsert on id, delete the op only on confirmation; head selection skips state='failed', and ops behind a parked parent park with it (F1). *(tasks 007 g1; split F1)*
- `g2` outbox/coalesce.ts — ≤1 pending update per row; backoff.ts — 5xx/network retry, 4xx park as failed; row _sync follows (F2). *(tasks 007 g2; spec RULE-11 RULE-12; split F2)*
- `g3` realtime/channel.ts — setAuth() before subscribe and on every refresh (I22); both topics; handlers → applyRemote incl. RETRACT; bursts applied in one transaction (F5). *(tasks 007 g3; split F5 F7; db §6.1)*
- `g4` reconcile/manifest-diff.ts — push → pull → resubscribe; paginated manifests for highlights AND highlight_notes; never compute gone from a capped page (F3, F8). *(tasks 007 g4; split F3 F8)*
- `g5` sync-slice + status selectors; the listener registered in store.ts (4-point edit). *(tasks 007 g5; fa §5.3, §6.4)*
- `g6` Tests: seq order, coalescing, 4xx parking, failed-head skip, reconnect order, delete detection, capped manifest. *(tasks 007 g6)*
- `g7` Pull non-mirrored tables (teams, team_members, memory_entries, llm_*) into Dexie meta on workspace open; their writes go through the outbox (DB-Q12 default). *(db §10 DB-Q12; split G1)*

**Gate —** Two browsers on the seed workspace: a row written in one appears in the other; kill the network, write three rows, restore — all three land once; a 403'd op parks without stalling the rest.
**Blocks —** [`015`](todo-task-015-realtime-presence.md), [`016`](todo-task-016-offline-and-export.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q3 | defaulted | sync is listener middleware | sync is listener middleware |
| Q10 | defaulted | hand-rolled sync; PowerSync escape hatch keyed to behaviour | hand-rolled |
| DB-Q3 | defaulted | per-profile Dexie; OPFS wiped with it | one database per profile |
| DB-Q12 | defaulted | non-mirrored tables pulled into Dexie `meta`; writes via outbox | g7 |
| DB-Q9 | defaulted | separate `live:{sessionId}` topic | presence/cursors are NOT on ws: — 015 adds live: |

---

## 4. Where the work lands

```
src/features/sync/{middleware,outbox,realtime,reconcile,bootstrap}/
src/features/sync/{stores,selectors,types}/
src/features/sync/components/sync-status-pill/
src/shared/lib/supabase.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- listed in g6, plus a paginated bootstrap resume test
- test.json.summary.total > 0

---

## 6. Hand-offs

- 015 layers presence on the same socket
- 016's mode switch drives sync.phase
- every feature's writes reach the server through this

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/007-task-sync-kernel/task.json`

```json
{
  "id": "007-task-sync-kernel",
  "title": "Local writes reach Supabase and remote changes reach Dexie, so the app is correct online and offline before any feature depends on it",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["006-task-entities-kernel"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 007, §4"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§2"},
    {"doc": "02-database-architecture.md", "section": "§6.1, §10"},
    {"doc": "todo-task-000-split.md", "section": "§5.1, §5.3 F1-F8"},
    {"doc": "03-frontend-architecture.md", "section": "§4, §6.4"},
    {"doc": "todo-task-007-sync-kernel.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "outbox/push.ts — drain in strict seq order, upsert on id, delete the op only on confirmation; head selection skips state='failed', and ops behind a parked parent park with it (F1)", "plan_ref": "tasks 007 g1; split F1", "status": "pending"},
    {"id": "g2", "description": "outbox/coalesce.ts — ≤1 pending update per row; backoff.ts — 5xx/network retry, 4xx park as failed; row _sync follows (F2)", "plan_ref": "tasks 007 g2; spec RULE-11 RULE-12; split F2", "status": "pending"},
    {"id": "g3", "description": "realtime/channel.ts — setAuth() before subscribe and on every refresh (I22); both topics; handlers → applyRemote incl. RETRACT; bursts applied in one transaction (F5)", "plan_ref": "tasks 007 g3; split F5 F7; db §6.1", "status": "pending"},
    {"id": "g4", "description": "reconcile/manifest-diff.ts — push → pull → resubscribe; paginated manifests for highlights AND highlight_notes; never compute gone from a capped page (F3, F8)", "plan_ref": "tasks 007 g4; split F3 F8", "status": "pending"},
    {"id": "g5", "description": "sync-slice + status selectors; the listener registered in store.ts (4-point edit)", "plan_ref": "tasks 007 g5; fa §5.3, §6.4", "status": "pending"},
    {"id": "g6", "description": "Tests: seq order, coalescing, 4xx parking, failed-head skip, reconnect order, delete detection, capped manifest", "plan_ref": "tasks 007 g6", "status": "pending"},
    {"id": "g7", "description": "Pull non-mirrored tables (teams, team_members, memory_entries, llm_*) into Dexie meta on workspace open; their writes go through the outbox (DB-Q12 default)", "plan_ref": "db §10 DB-Q12; split G1", "status": "pending"}
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
  "task_id": "007-task-sync-kernel",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 007, §4"},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§2"},
    {"doc": "02-database-architecture.md", "section": "§6.1, §10"},
    {"doc": "todo-task-000-split.md", "section": "§5.1, §5.3 F1-F8"},
    {"doc": "03-frontend-architecture.md", "section": "§4, §6.4"},
    {"doc": "todo-task-007-sync-kernel.md", "section": "full file"}
  ],
  "scope": "Outbox push, realtime pull, reconcile, bootstrap, the sync slice and pill. No feature UI. Out of scope: Import @supabase/supabase-js anywhere but channel.ts and shared/lib/supabase.ts (I21). Retry a 4xx. Subscribe before reconcile.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "A parked op never stalls the ops queued behind it."},
    {"goal_id": "g2", "text": "A 403 parks once and surfaces; a 503 retries with backoff."},
    {"goal_id": "g3", "text": "40 events in a burst cause one Dexie transaction, not 40."},
    {"goal_id": "g4", "text": "A manifest that hits the page cap deletes nothing."},
    {"goal_id": "g5", "text": "Every sync step is a dispatched action visible in DevTools."},
    {"goal_id": "g6", "text": "Each listed behaviour has a failing-then-passing test."},
    {"goal_id": "g7", "text": "No component reads those tables over the network."}
  ],
  "open_questions": ["Q3 (defaulted: sync is listener middleware) — sync is listener middleware.", "Q10 (defaulted: hand-rolled sync; PowerSync escape hatch keyed to behaviour) — hand-rolled.", "DB-Q3 (defaulted: per-profile Dexie; OPFS wiped with it) — one database per profile.", "DB-Q12 (defaulted: non-mirrored tables pulled into Dexie `meta`; writes via outbox) — g7.", "DB-Q9 (defaulted: separate `live:{sessionId}` topic) — presence/cursors are NOT on ws: — 015 adds live:."],
  "risks": ["One of the two tasks most likely to overrun (tasks §4) — budget a spike.", "Honest size is 800-1200 lines with tests (split §5.1); the PowerSync escape hatch is keyed to behaviour, not line count.", "Missing setAuth() after refresh: delivery stops silently about an hour in (I22).", "Pull before push overwrites unsent local rows (RULE-13)."]
}
```

### 7.3 `validate.json` — 7 goal checks, no exceptions

```json
{
  "task_id": "007-task-sync-kernel",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 007, §4", "result": ""},
    {"doc": "05-frontend-sync-handwriting.md", "section": "§2", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§6.1, §10", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§5.1, §5.3 F1-F8", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§4, §6.4", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/007-todo-sync-kernel/contract.json`:

```json
{
  "id": "007-todo-sync-kernel",
  "name": "Sync kernel",
  "goal": "Local writes reach Supabase and remote changes reach Dexie, so the app is correct online and offline before any feature depends on it.",
  "todo_path": "agent-thinking/todo/007-todo-sync-kernel/contract.json",
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

`06-whole-apps-task.md` PHASE C · 007, §4, `05-frontend-sync-handwriting.md` §2, `02-database-architecture.md` §6.1, §10, `todo-task-000-split.md` §5.1, §5.3 F1-F8, `03-frontend-architecture.md` §4, §6.4. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
