---
doc_id: thinkboard-lite-task-001
title: Task 001 — Supabase Lite migration
version: "1.0"
status: proposed
updated: 2026-09-18
task: "001"
phase: "B — Data contract"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 001 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 001 — Supabase Lite migration

`001-task-supabase-lite-migration` · `supabase` · phase B — Data contract · depends on [`000`](todo-task-000-split.md) · blocks [`002`](todo-task-002-rls-access-proof.md), [`003`](todo-task-003-types-and-seed.md), [`017`](todo-task-017-command-endpoints.md)

**Main goal —** The Lite schema exists on a fresh project, so the frontend has real tables to build against.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | Waits for task 000 **package A only** (split §6) — the decision registry is all it needs. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 001 only. |
| **Do not** | Invent a table, column or policy not in db §8.1. Seed data (003), generate types (003), write RLS tests (002), or add the live topic (015). |

---

## 1. What can go wrong

- The RLS rewrite is the highest-risk item in the plan (spec §11 #3) — task 002 is its proof, so do not skip ahead.
- Precedence points at the wrong enum (split C6): 06-era text still shows two values. Implement three.
- 0001-0003 are not in this repo; every assumption about them is a db §11 verify item, not a fact.
- Security-definer functions must pin search_path (they do in §8.1) — do not drop it when editing.
- Use the new key names (sb_publishable_ / sb_secret_) in any config written; 0003 still uses anon / service_role.

---

## 2. Goals and gate

- `g1` Apply 0001-0003 clean on a fresh local stack, then check the db §11 verify row against them: helpers STABLE, RLS enabled on the run-cluster tables, no permissive client writes there, memory_entries group scope (DB-Q10). *(tasks 001 g1; db §11)*
- `g2` Author 0004_lite.sql as db §8.1 verbatim: three enums (note_input_mode has three values), highlight_notes with transcribed_by, six columns, can_lead_session / can_own_run / can_write_run, promote_highlight RPC, two touch triggers. *(tasks 001 g2; db §8.1; split C6)*
- `g3` Four broadcast triggers with per-row topic selection (ws:{sessionId} vs user:{profileId}), the NULL-topic guard and RETRACT on unshare. *(tasks 001 g3; db §8.1 DB-F2 DB-F5 DB-F8)*
- `g4` The two realtime.messages policies. *(tasks 001 g4; db §8.1)*
- `g5` Drop and recreate "artifact highlights" and "highlight conclusions" — the only non-additive change — plus membership in every client with-check (DB-F4) and the run-cluster policies (DB-F6, DB-F7); note all of it in code.json.decisions. *(tasks 001 g5; db §8.1)*
- `g6` supabase db reset runs clean end to end, twice; 0004 applied twice on one database is a no-op. *(tasks 001 g6; db §9 #13)*
- `g7` create_workspace RPC per the DB-Q6 default — only once a human confirms its signature; otherwise mark blocked. *(db §10 DB-Q6)*

**Gate —** Reset from scratch twice with no manual fixes; `0004` re-run is a no-op; **C6 signed off by a human before g2 ships**.
**Blocks —** [`002`](todo-task-002-rls-access-proof.md), [`003`](todo-task-003-types-and-seed.md), [`017`](todo-task-017-command-endpoints.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-01 | defaulted | individual is a privacy boundary | the private-highlight policies exist because of it |
| D-05 | **confirmed** | 06-whole-apps-task.md is the backlog | confirms this is task 001 of the backlog |
| D-07 | defaulted | explicit promotion via `shared_at` | promote_highlight() is the promotion path |
| D-12 | **unanswered** | — | must be listed (spec §10); no effect on the SQL |
| DB-Q4 | defaulted | keep parked tables parked | parked tables stay; nothing dropped |
| DB-Q6 | defaulted | `create_workspace` definer RPC; creator is leader | g7 |
| DB-Q10 | defaulted | verify 0001; add a restrictive policy if needed | g1 verify; may add a restrictive policy |
| C6 | **awaiting human sign-off** (split §3) | three-value enum | **needs a human yes** — three-value enum |

---

## 4. Where the work lands

```
database-thinkboard-lite/supabase/migrations/0004_lite.sql   # next to 0001-0003
code.json.decisions         # the non-additive change, recorded
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- reset twice from scratch
- apply 0004 twice on one database
- the policy behaviour itself is task 002 — do not claim it here

---

## 6. Hand-offs

- 002 tests the policies this task writes
- 003 generates types from the migrated schema
- 017 relies on can_lead_session() and the run-cluster policies

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/001-task-supabase-lite-migration/task.json`

```json
{
  "id": "001-task-supabase-lite-migration",
  "title": "The Lite schema exists on a fresh project, so the frontend has real tables to build against",
  "architecture": "supabase",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["000-task-architecture-contract"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 001"},
    {"doc": "02-database-architecture.md", "section": "§2, §7, §8, §8.1, §10, §11"},
    {"doc": "todo-task-000-split.md", "section": "§3 C6, §4.1, §6"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§3 RULE-01..06, §6 (record only), §10"},
    {"doc": "todo-task-001-supabase-lite-migration.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Apply 0001-0003 clean on a fresh local stack, then check the db §11 verify row against them: helpers STABLE, RLS enabled on the run-cluster tables, no permissive client writes there, memory_entries group scope (DB-Q10)", "plan_ref": "tasks 001 g1; db §11", "status": "pending"},
    {"id": "g2", "description": "Author 0004_lite.sql as db §8.1 verbatim: three enums (note_input_mode has three values), highlight_notes with transcribed_by, six columns, can_lead_session / can_own_run / can_write_run, promote_highlight RPC, two touch triggers", "plan_ref": "tasks 001 g2; db §8.1; split C6", "status": "pending"},
    {"id": "g3", "description": "Four broadcast triggers with per-row topic selection (ws:{sessionId} vs user:{profileId}), the NULL-topic guard and RETRACT on unshare", "plan_ref": "tasks 001 g3; db §8.1 DB-F2 DB-F5 DB-F8", "status": "pending"},
    {"id": "g4", "description": "The two realtime.messages policies", "plan_ref": "tasks 001 g4; db §8.1", "status": "pending"},
    {"id": "g5", "description": "Drop and recreate \"artifact highlights\" and \"highlight conclusions\" — the only non-additive change — plus membership in every client with-check (DB-F4) and the run-cluster policies (DB-F6, DB-F7); note all of it in code.json.decisions", "plan_ref": "tasks 001 g5; db §8.1", "status": "pending"},
    {"id": "g6", "description": "supabase db reset runs clean end to end, twice; 0004 applied twice on one database is a no-op", "plan_ref": "tasks 001 g6; db §9 #13", "status": "pending"},
    {"id": "g7", "description": "create_workspace RPC per the DB-Q6 default — only once a human confirms its signature; otherwise mark blocked", "plan_ref": "db §10 DB-Q6", "status": "pending"}
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
  "task_id": "001-task-supabase-lite-migration",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 001"},
    {"doc": "02-database-architecture.md", "section": "§2, §7, §8, §8.1, §10, §11"},
    {"doc": "todo-task-000-split.md", "section": "§3 C6, §4.1, §6"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§3 RULE-01..06, §6 (record only), §10"},
    {"doc": "todo-task-001-supabase-lite-migration.md", "section": "full file"}
  ],
  "scope": "The Lite delta migration only: 0004_lite.sql per db §8.1, applied on a fresh local stack, and the verify row against 0001-0003. Out of scope: Invent a table, column or policy not in db §8.1. Seed data (003), generate types (003), write RLS tests (002), or add the live topic (015).",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "0001-0003 apply with no manual fix, and each verify item is recorded pass/fail in analyze.json."},
    {"goal_id": "g2", "text": "0004_lite.sql is byte-for-byte the db §8.1 block, or every difference is listed in code.json.decisions."},
    {"goal_id": "g3", "text": "highlights, highlight_notes, mini_conclusions and pipeline_runs each carry an after-row broadcast trigger."},
    {"goal_id": "g4", "text": "Both policies exist and are re-created cleanly on re-run."},
    {"goal_id": "g5", "text": "code.json.decisions names the two dropped policies and the run-cluster policy set."},
    {"goal_id": "g6", "text": "Two consecutive resets and a second apply of 0004 all exit 0."},
    {"goal_id": "g7", "text": "Either the RPC exists with a confirmed signature, or g7 is blocked with that reason."}
  ],
  "open_questions": ["D-01 (defaulted: individual is a privacy boundary) — the private-highlight policies exist because of it.", "D-05 (confirmed: 06-whole-apps-task.md is the backlog) — confirms this is task 001 of the backlog.", "D-07 (defaulted: explicit promotion via `shared_at`) — promote_highlight() is the promotion path.", "D-12 (unanswered) — must be listed (spec §10); no effect on the SQL.", "DB-Q4 (defaulted: keep parked tables parked) — parked tables stay; nothing dropped.", "DB-Q6 (defaulted: `create_workspace` definer RPC; creator is leader) — g7.", "DB-Q10 (defaulted: verify 0001; add a restrictive policy if needed) — g1 verify; may add a restrictive policy.", "C6 — needs a human yes — three-value enum."],
  "risks": ["The RLS rewrite is the highest-risk item in the plan (spec §11 #3) — task 002 is its proof, so do not skip ahead.", "Precedence points at the wrong enum (split C6): 06-era text still shows two values. Implement three.", "0001-0003 are not in this repo; every assumption about them is a db §11 verify item, not a fact.", "Security-definer functions must pin search_path (they do in §8.1) — do not drop it when editing.", "Use the new key names (sb_publishable_ / sb_secret_) in any config written; 0003 still uses anon / service_role."]
}
```

### 7.3 `validate.json` — 7 goal checks, no exceptions

```json
{
  "task_id": "001-task-supabase-lite-migration",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 001", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§2, §7, §8, §8.1, §10, §11", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§3 C6, §4.1, §6", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§3 RULE-01..06, §6 (record only), §10", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/001-todo-supabase-lite-migration/contract.json`:

```json
{
  "id": "001-todo-supabase-lite-migration",
  "name": "Supabase Lite migration",
  "goal": "The Lite schema exists on a fresh project, so the frontend has real tables to build against.",
  "todo_path": "agent-thinking/todo/001-todo-supabase-lite-migration/contract.json",
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

`06-whole-apps-task.md` PHASE B · 001, `02-database-architecture.md` §2, §7, §8, §8.1, §10, §11, `todo-task-000-split.md` §3 C6, §4.1, §6, `01-thinkboard-lite-spec.md` §3 RULE-01..06, §6 (record only), §10. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
