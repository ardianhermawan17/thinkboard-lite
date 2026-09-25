---
doc_id: thinkboard-lite-task-030
title: Task 030 — Database housekeeping (grants and roster names)
version: "1.0"
status: proposed
updated: 2026-09-26
task: "030"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["02-database-architecture.md", "task-review-2026-09-25.md"]
authority: "Scope and contract for task 030 only."
---

# Task 030 — Database housekeeping

`030-task-db-housekeeping` · `supabase` · phase G — Integration · depends on [`001`](todo-task-001-supabase-lite-migration.md), [`002`](todo-task-002-rls-access-proof.md) · blocks — (closes two carried housekeeping items)

**Main goal —** `anon` cannot call the definer RPCs, and a teammate can read a co-member's name.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Do not** | Grant anything to `anon`; widen visibility beyond a shared team. |

---

## 1. What can go wrong

- Supabase grants EXECUTE to PUBLIC by default, which `anon` inherits; revoke from PUBLIC, not only from `anon`.
- A profiles policy that checks membership naively could let an outsider read any profile; the co-membership join prevents that.

---

## 2. Goals and gate

- `g1` 0007 revokes anon EXECUTE and sets the default.
- `g2` 0008 adds the co-member read policy.
- `g3` `rls.sql` proves both.
- `g4` the docs mark the items done.

**Gate —** the live RLS suite passes with the new checks.

---

## 3. Decisions and conflicts this task touches

| Id | State | What it means here |
|---|---|---|
| DB-1 | standing | RLS is the authorization layer; an unauthenticated caller must not reach a definer function |
| RULE-01 | standing | no secret key; the change is grants + a policy, not a key |

---

## 4. Where the work lands

```
database-thinkboard-lite/supabase/migrations/{0007_revoke_anon_execute,0008_team_profile_names}.sql
database-thinkboard-lite/supabase/tests/rls.sql   (g17/g18)
README.md §6, task-review-2026-09-25.md §3.5
```

---

## 5. Tests that must exist

- anon denied on `create_workspace`; authenticated allowed
- a teammate reads a co-member's profile; an outsider does not

---

## 6. Hand-offs

- none; the schema's source of truth (`02 §8.1`) is unchanged (grants and one policy are additive).

---

## 7. Contract scaffolding

### 7.1 `agent-history/030-task-db-housekeeping/task.json`

```json
{
  "id": "030-task-db-housekeeping",
  "title": "Anon cannot call the definer RPCs, and a teammate can read a co-member's name",
  "architecture": "supabase",
  "secondary_architecture": [],
  "created_at": "2026-09-26T00:00:00Z",
  "status": "pending",
  "depends_on": ["001-task-supabase-lite-migration", "002-task-rls-access-proof"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 030"},
    {"doc": "02-database-architecture.md", "section": "§8.1"},
    {"doc": "task-review-2026-09-25.md", "section": "§3.5 housekeeping"},
    {"doc": "todo-task-030-db-housekeeping.md", "section": "§2, §3"}
  ],
  "goals": [
    {"id": "g1", "description": "0007 revokes EXECUTE on public functions from PUBLIC and anon, grants authenticated, and sets the default", "plan_ref": "tasks 030 g1; RULE-01", "status": "pending"},
    {"id": "g2", "description": "0008 adds a permissive co-member SELECT policy on profiles", "plan_ref": "tasks 030 g2", "status": "pending"},
    {"id": "g3", "description": "rls.sql proves g1 and g2", "plan_ref": "tasks 030 g3", "status": "pending"},
    {"id": "g4", "description": "the docs mark the housekeeping items done", "plan_ref": "tasks 030 g4", "status": "pending"}
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
  "task_id": "030-task-db-housekeeping",
  "phase": "analyze",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 030"},
    {"doc": "02-database-architecture.md", "section": "§8.1"},
    {"doc": "task-review-2026-09-25.md", "section": "§3.5"},
    {"doc": "todo-task-030-db-housekeeping.md", "section": "full file"}
  ],
  "scope": "Two additive migrations and their live-suite checks. Out of scope: any schema/column change; the functions themselves.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "anon is denied; authenticated is allowed."},
    {"goal_id": "g2", "text": "a teammate reads a co-member; an outsider does not."},
    {"goal_id": "g3", "text": "the checks run in rls.sql."},
    {"goal_id": "g4", "text": "README/review mark them done."}
  ],
  "open_questions": ["Additive grants and one policy; the schema's source of truth (02 §8.1) does not change."],
  "risks": ["Revoking from PUBLIC then granting authenticated must leave RLS policy helpers callable; the live suite proves it."]
}
```

### 7.3 `validate.json` — 4 goal checks

```json
{
  "task_id": "030-task-db-housekeeping",
  "phase": "validate",
  "goal_checks": [
    {"goal_id": "g1", "status": "", "notes": ""},
    {"goal_id": "g2", "status": "", "notes": ""},
    {"goal_id": "g3", "status": "", "notes": ""},
    {"goal_id": "g4", "status": "", "notes": ""}
  ],
  "cross_check_against_plan": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE G · 030", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§8.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry

```json
{
  "id": "030-todo-db-housekeeping",
  "name": "Database housekeeping",
  "goal": "Anon cannot call the definer RPCs, and a teammate can read a co-member's name.",
  "todo_path": "agent-thinking/todo/030-todo-db-housekeeping/contract.json",
  "agent_history": null,
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per goal, **4 here** · anything touching RLS cannot reach validate with zero tests · **no git write without explicit confirmation**.

---

## 9. Sources

`06-whole-apps-task.md` PHASE G · 030, `02-database-architecture.md` §8.1, `task-review-2026-09-25.md` §3.5.
