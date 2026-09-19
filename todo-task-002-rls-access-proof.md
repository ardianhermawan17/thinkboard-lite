---
doc_id: thinkboard-lite-task-002
title: Task 002 — RLS access proof
version: "1.0"
status: proposed
updated: 2026-09-18
task: "002"
phase: "B — Data contract"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 002 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 002 — RLS access proof

`002-task-rls-access-proof` · `supabase` · phase B — Data contract · depends on [`001`](todo-task-001-supabase-lite-migration.md) · blocks [`008`](todo-task-008-auth-and-workspace-shell.md)

**Main goal —** Prove the access model in code, because DB-1 makes RLS the authorization layer rather than a safety net.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 002 only. |
| **Do not** | Weaken a policy to make a test pass — a red test here is a finding for 001, not for this task. Test as a privileged role. |

---

## 1. What can go wrong

- A realtime assertion that passes because the client never subscribed. Assert the positive case (g5's promoted row) in the same test as the negative one.
- Testing as the postgres role bypasses RLS entirely. Every query must run under a signed-in user's JWT.
- setAuth() before subscribe (I22) applies to the test clients too, or g5/g10/g12 silently receive nothing.

---

## 2. Goals and gate

- `g1` Seed two members (A, B) and one leader in one workspace for the tests. *(tasks 002 g1)*
- `g2` B cannot select A's private highlight. *(tasks 002 g2; db §9 #1)*
- `g3` B cannot select the mini_conclusion of A's private highlight. *(tasks 002 g3; db §9 #2)*
- `g4` B cannot insert layer='group'; the leader can. *(tasks 002 g4; db §9 #3 #6)*
- `g5` B receives A's promoted highlight on ws:{sessionId}, and A's private highlight on no topic. *(tasks 002 g5; db §9 #4 #5)*
- `g6` promote_highlight() flips the highlight and its note together, and refuses someone else's row. *(tasks 002 g6)*
- `g7` After removal from team_members, A cannot insert a highlight or a note in the workspace. *(db §9 #7 DB-F4)*
- `g8` B cannot select A's individual run, its points, conclusions or renderings. *(db §9 #8 DB-F6)*
- `g9` B cannot insert a run with owner_profile_id null; the leader can; A can insert their own. *(db §9 #9 DB-F7 D-03)*
- `g10` A unshares a promoted highlight: B receives RETRACT on ws:{sessionId}; A's other device keeps the row. *(db §9 #10 DB-F8)*
- `g11` A's group-visibility note on A's private highlight does not reach ws:{sessionId}, and B cannot select it. *(db §9 #11 RULE-03 DB-Q7)*
- `g12` A mini-conclusion for a promoted highlight arrives on ws:{sessionId}; for a private one only on user:{A}. *(db §9 #12 DB-F5)*
- `g13` 0004_lite.sql applied twice on the same database raises no error. *(db §9 #13 DB-F3)*
- `g14` Run children (points, point_conclusions, run_renderings, pipeline_stages): a non-owner, non-leader cannot insert, update or delete rows of a group run, nor delete the run; the leader can; A can on A's own individual run. *(db §9 #14 DB-F11)*
- `g15` memory_entries: a member cannot write scope 'group' or 'initial'; the leader can write both. *(db §9 #15 DB-F12 DB-Q10)*
- `g16` create_workspace makes the caller the one leader; transfer_leadership refuses a non-leader and a non-member target, and leaves exactly one leader. *(db §9 #16 DB-F13 DB-Q6 D-09)*

**Gate —** All sixteen green against a real local Supabase. `g3`, `g5`, `g8` and `g11` are the ones that never surface in manual testing.
**Blocks —** [`008`](todo-task-008-auth-and-workspace-shell.md).

`g14`–`g16` were added at analyze (owner, 2026-09-19): they pin what task 001 added on reading `0001`. Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-01 | defaulted | individual is a privacy boundary | g2, g3, g8 are its proof |
| D-03 | defaulted | group result is leader-only | g9 |
| D-07 | defaulted | explicit promotion via `shared_at` | g6 |
| DB-Q1 | defaulted | = D-01 | = D-01 |
| DB-Q7 | defaulted | member group-visibility notes allowed as written | g11 pins today's behaviour |
| DB-Q10 | **confirmed** | `0001` had no write policy; "leader writes memory" added (owner, 2026-09-18) | g15 |
| DB-Q6 | **confirmed** | `create_workspace` + `transfer_leadership` (owner, 2026-09-18) | g16 |
| D-09 | defaulted | leadership transfers, by the leader or the creator | g16 tests the leader path; the creator path is not built (task 001 decision) |
| *new* | resolved by default | no dependency | delivery goals (g5, g10-g12) are proven at the routing + authorization layer in SQL, so no `@supabase/supabase-js` is added. A live-socket test is the upgrade if a delivery bug ever slips through. |

---

## 4. Where the work lands

```
database-thinkboard-lite/supabase/tests/rls.sql        # g1-g12, g14-g16 — one rolled-back transaction, every check as role `authenticated` with a JWT sub
database-thinkboard-lite/supabase/tests/rls.test.mjs   # runs rls.sql through docker exec psql; g13 re-applies 0004; `npm test`
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- this task is its tests: 16 cases, test.json.summary.total ≥ 16 (RLS rule)

---

## 6. Hand-offs

- 008 builds against the proven access model
- 013 re-proves g2/g6 from the UI

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/002-task-rls-access-proof/task.json`

```json
{
  "id": "002-task-rls-access-proof",
  "title": "Prove the access model in code, because DB-1 makes RLS the authorization layer rather than a safety net",
  "architecture": "supabase",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["001-task-supabase-lite-migration"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 002"},
    {"doc": "02-database-architecture.md", "section": "§4.1, §8.1, §9, §10, §11"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§3 RULE-01..06, §5.1, §5.2"},
    {"doc": "todo-task-002-rls-access-proof.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Seed two members (A, B) and one leader in one workspace for the tests", "plan_ref": "tasks 002 g1", "status": "pending"},
    {"id": "g2", "description": "B cannot select A's private highlight", "plan_ref": "tasks 002 g2; db §9 #1", "status": "pending"},
    {"id": "g3", "description": "B cannot select the mini_conclusion of A's private highlight", "plan_ref": "tasks 002 g3; db §9 #2", "status": "pending"},
    {"id": "g4", "description": "B cannot insert layer='group'; the leader can", "plan_ref": "tasks 002 g4; db §9 #3 #6", "status": "pending"},
    {"id": "g5", "description": "B receives A's promoted highlight on ws:{sessionId}, and A's private highlight on no topic", "plan_ref": "tasks 002 g5; db §9 #4 #5", "status": "pending"},
    {"id": "g6", "description": "promote_highlight() flips the highlight and its note together, and refuses someone else's row", "plan_ref": "tasks 002 g6", "status": "pending"},
    {"id": "g7", "description": "After removal from team_members, A cannot insert a highlight or a note in the workspace", "plan_ref": "db §9 #7 DB-F4", "status": "pending"},
    {"id": "g8", "description": "B cannot select A's individual run, its points, conclusions or renderings", "plan_ref": "db §9 #8 DB-F6", "status": "pending"},
    {"id": "g9", "description": "B cannot insert a run with owner_profile_id null; the leader can; A can insert their own", "plan_ref": "db §9 #9 DB-F7 D-03", "status": "pending"},
    {"id": "g10", "description": "A unshares a promoted highlight: B receives RETRACT on ws:{sessionId}; A's other device keeps the row", "plan_ref": "db §9 #10 DB-F8", "status": "pending"},
    {"id": "g11", "description": "A's group-visibility note on A's private highlight does not reach ws:{sessionId}, and B cannot select it", "plan_ref": "db §9 #11 RULE-03 DB-Q7", "status": "pending"},
    {"id": "g12", "description": "A mini-conclusion for a promoted highlight arrives on ws:{sessionId}; for a private one only on user:{A}", "plan_ref": "db §9 #12 DB-F5", "status": "pending"},
    {"id": "g13", "description": "0004_lite.sql applied twice on the same database raises no error", "plan_ref": "db §9 #13 DB-F3", "status": "pending"},
    {"id": "g14", "description": "Run children (points, point_conclusions, run_renderings, pipeline_stages): a non-owner, non-leader cannot insert, update or delete rows of a group run, nor delete the run; the leader can; A can on A's own individual run", "plan_ref": "db §9 #14 DB-F11", "status": "pending"},
    {"id": "g15", "description": "memory_entries: a member cannot write scope 'group' or 'initial'; the leader can write both", "plan_ref": "db §9 #15 DB-F12 DB-Q10", "status": "pending"},
    {"id": "g16", "description": "create_workspace makes the caller the one leader; transfer_leadership refuses a non-leader and a non-member target, and leaves exactly one leader", "plan_ref": "db §9 #16 DB-F13 DB-Q6 D-09", "status": "pending"}
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
  "task_id": "002-task-rls-access-proof",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 002"},
    {"doc": "02-database-architecture.md", "section": "§4.1, §8.1, §9, §10, §11"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§3 RULE-01..06, §5.1, §5.2"},
    {"doc": "todo-task-002-rls-access-proof.md", "section": "full file"}
  ],
  "scope": "Automated proof of the RLS and broadcast-topic model against a real local Supabase. No product code. Out of scope: Weaken a policy to make a test pass — a red test here is a finding for 001, not for this task. Test as a privileged role.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "A test fixture creates the three profiles and one workspace from scratch."},
    {"goal_id": "g2", "text": "Query as B returns 0 rows."},
    {"goal_id": "g3", "text": "Query as B returns 0 rows."},
    {"goal_id": "g4", "text": "B's insert is an RLS denial; the leader's succeeds."},
    {"goal_id": "g5", "text": "B's subscribed client sees exactly one event, for the promoted row."},
    {"goal_id": "g6", "text": "Both rows change in one call; B's call on A's highlight raises."},
    {"goal_id": "g7", "text": "Both inserts are RLS denials."},
    {"goal_id": "g8", "text": "All four queries as B return 0 rows."},
    {"goal_id": "g9", "text": "Denial, success, success — in that order."},
    {"goal_id": "g10", "text": "B's client gets RETRACT; A's second client gets UPDATE on user:{A}."},
    {"goal_id": "g11", "text": "Nothing arrives for B; B's select returns 0 rows."},
    {"goal_id": "g12", "text": "Routing matches the highlight's visibility in both cases."},
    {"goal_id": "g13", "text": "The second apply exits 0."},
    {"goal_id": "g14", "text": "Every write by B on a group run's children, and B's delete of the group run, changes no row or is denied; the leader's and A's-own-run writes succeed."},
    {"goal_id": "g15", "text": "B's inserts (group, initial) are RLS denials; the leader's both succeed; B still reads group memory."},
    {"goal_id": "g16", "text": "Caller is leader after create_workspace; the two refusals raise; after a valid transfer exactly one leader exists and it is the target."}
  ],
  "open_questions": ["D-01 (defaulted: individual is a privacy boundary) — g2, g3, g8 are its proof.", "D-03 (defaulted: group result is leader-only) — g9.", "D-07 (defaulted: explicit promotion via `shared_at`) — g6.", "DB-Q1 (defaulted: = D-01) — = D-01.", "DB-Q7 (defaulted: member group-visibility notes allowed as written) — g11 pins today's behaviour.", "DB-Q10 (confirmed: 0001 had no write policy; leader writes memory) — g15.", "DB-Q6 (confirmed) — g16.", "D-09 (defaulted) — g16 tests the leader path only.", "NEW: @supabase/supabase-js devDependency for the realtime tests — awaiting the owner's yes."],
  "risks": ["A realtime assertion that passes because the client never subscribed. Assert the positive case (g5's promoted row) in the same test as the negative one.", "Testing as the postgres role bypasses RLS entirely. Every query must run under a signed-in user's JWT.", "setAuth() before subscribe (I22) applies to the test clients too, or g5/g10/g12 silently receive nothing."]
}
```

### 7.3 `validate.json` — 16 goal checks, no exceptions

```json
{
  "task_id": "002-task-rls-access-proof",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""},
    {"goal_id": "g5", "status": "", "notes": ""},
    {"goal_id": "g6", "status": "", "notes": ""},
    {"goal_id": "g7", "status": "", "notes": ""},
    {"goal_id": "g8", "status": "", "notes": ""},
    {"goal_id": "g9", "status": "", "notes": ""},
    {"goal_id": "g10", "status": "", "notes": ""},
    {"goal_id": "g11", "status": "", "notes": ""},
    {"goal_id": "g12", "status": "", "notes": ""},
    {"goal_id": "g13", "status": "", "notes": ""},
    {"goal_id": "g14", "status": "", "notes": ""},
    {"goal_id": "g15", "status": "", "notes": ""},
    {"goal_id": "g16", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE B · 002", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§4.1, §8.1, §9, §10, §11", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§3 RULE-01..06, §5.1, §5.2", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/002-todo-rls-access-proof/contract.json`:

```json
{
  "id": "002-todo-rls-access-proof",
  "name": "RLS access proof",
  "goal": "Prove the access model in code, because DB-1 makes RLS the authorization layer rather than a safety net.",
  "todo_path": "agent-thinking/todo/002-todo-rls-access-proof/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **16 here** · anything
touching RLS or stage transitions cannot reach validate with `test.json.summary.total: 0` · open decisions go in
`analyze.json.open_questions`, never silently resolved · **no git write without explicit confirmation, every
time** (`09-agent-limitation.md` §1), on the shadow branch, never `master` · `npm run verify` green before a
frontend task closes.

---

## 9. Sources

`06-whole-apps-task.md` PHASE B · 002, `02-database-architecture.md` §4.1, §8.1, §9, §10, §11, `01-thinkboard-lite-spec.md` §3 RULE-01..06, §5.1, §5.2. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
