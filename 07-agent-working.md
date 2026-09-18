---
doc_id: thinkboard-agent-working
title: Agent Working Contract
status: normative
read_order_position: 7
authority: "Process. Wins over every other doc on how an agent works."
---

# 07 — Agent Working Contract

Operating contract for any AI agent (Claude Code or otherwise) building ThinkBoard.
It defines how the agent **analyzes → reads → codes → tests → validates → reports**, and how
that work is tracked, resumably, in `agent-history/`. Source of truth for Lite product intent is
`01-thinkboard-lite-spec.md`, for schema `02-database-architecture.md`, and for the backlog
`06-whole-apps-task.md` (Full's remain `00-thinkboard-abstract-plan.md` and
`thinkboard-schema-final.sql`, outside this repo) — this file only governs *process*, not *product*.
The step-by-step walk through this contract is the main gate, [`README.md`](README.md).

> **Lite update, 2026-09-18.** The owner cleared the Full-era records (`agent-history/` 001–010,
> `running-process.json`, `tracking-todo.json`). Numbering restarts with the Lite plan: **plan id =
> folder id** (`000`–`024`), and §3's never-reuse rule applies from here on. Examples below use Lite tasks.

---

## 0. Non-negotiables

1. No code is written before a task has a `task.json` and a completed `analyze.json`.
2. No task moves to `validate` while any goal in `task.json.goals` is still `pending`/`in_progress`
   with no `blocked_reason`.
3. `agent-history/running-process.json` is read **first**, before touching any other file, at
   the start of every agent session — it is the resumption pointer.
4. Every JSON file in this contract must stay valid, parseable JSON. No comments, no trailing
   commas. Field tables below double as the schema documentation.

---

## 1. Directory contract

```
thinkboard-lite-architecture/          # this repo — plan + process
  agent-thinking/
    tracking-todo.json                 # intake index (08-agent-todo-intake.md)
    todo/000-todo-architecture-contract/contract.json
  agent-history/
    running-process.json               # resumption pointer
    000-task-architecture-contract/
      task.json
      analyze.json
      code.json
      test.json
      validate.json
      result.json
    001-task-supabase-lite-migration/
      task.json
      analyze.json
      ...
  todo-task-NNN-<slug>.md              # the per-task plan an agent opens the folder from
  frontend-thinkboard-lite/            # the Next.js app — own git repo; src/server/** is Lite's "backend"
thinkboard-supabase/                   # migrations 0001-0004 — outside this repo
```

Rules:
- One unit of agent work = one folder under `agent-history/`, named exactly
  `NNN-task-<kebab-slug>` (rule in §3).
- A task folder always contains `task.json`. The five phase files are created lazily, one per
  phase, only as the agent actually enters that phase — a task interrupted mid-analyze
  legitimately has only `task.json` + `analyze.json` on disk, and that is a valid, resumable state.
- Nothing is ever deleted from `agent-history/`. A cancelled or superseded task keeps its folder
  and gets `task.json.status = "cancelled"` — it's the audit trail, not scratch space.

---

## 2. Phase model (5 stages → 5 files)

| Stage (as requested) | File | Notes |
|---|---|---|
| Analyze **+ Read** | `analyze.json` | "Read" is not a separate file — every `analyze.json` must open by reading the `plan_refs` and any existing related code *before* writing findings. This is also requirement #1's "analyze" folder. |
| Code | `code.json` | Requirement #1's "code" folder. |
| (Test) | `test.json` | Requirement #1's "test" folder — split out from validate because automated-test evidence and goal/spec validation are different checks with different failure modes. |
| Validate | `validate.json` | Requirement #1's "validation" folder. Checks code+tests against `task.json.goals` and against the plan/schema docs. |
| Result | `result.json` | The requested final "result" stage — closes the task, recomputes goal completion, updates `running-process.json`. |

A task's `task.json.phases` map tracks which of the five files exist and their individual status
(§4.2), so partial progress is always visible without opening every phase file.

---

## 3. Naming & numbering

- `NNN` — zero-padded 3-digit, **global monotonic counter across the whole project**, not
  per-architecture. Numbers are never reused or resequenced, even for a cancelled task.
- `task-` — literal, exactly as requested (requirement #2: every task folder/id starts
  `NNN-task-`).
- `<kebab-slug>` — short, descriptive, architecture-agnostic (architecture is a `task.json`
  field, not part of the name, so a task can be re-tagged without renaming its folder).
- Example progression (Lite): `000-task-architecture-contract`, `001-task-supabase-lite-migration`,
  `002-task-rls-access-proof`. The slug is the one `06-whole-apps-task.md` gives the task, and its plan
  doc is `todo-task-NNN-<slug>.md` at the repo root (task 000's is `todo-task-000-split.md`).

---

## 4. JSON contracts

All files are JSON. `task_id` inside every phase file must match the folder name exactly, so a
phase file can be validated in isolation without trusting its file path.

> The examples in §4 are illustrative **shapes** from the Full era. Lite's real, ready-to-copy
> `task.json` / `analyze.json` / `validate.json` for each task are in `todo-task-NNN-<slug>.md` §7.

### 4.1 `agent-history/running-process.json`

The single resumption pointer. Updated at the **start and end** of every phase transition, so a
crash mid-phase leaves `current_phase` pointing at the phase that was interrupted — the agent's
first action on resume is to re-validate that phase's file, not blindly continue past it.

| Field | Type | Description |
|---|---|---|
| `schema_version` | string | Contract version, e.g. `"1.0"`. |
| `updated_at` | ISO-8601 string | Last write time. |
| `current_task_id` | string \| null | The task currently being worked, or `null` if idle. |
| `current_phase` | `"analyze"\|"code"\|"test"\|"validate"\|"result"\|"idle"` | Where the agent was/is. |
| `history_path` | string \| null | Relative path to the current task folder, or `null` if idle. |
| `status` | `"idle"\|"in_progress"\|"blocked"` | Overall process state. |
| `task_sequence` | array | Ordered list of `{id, architecture, status, title}` — a flat index of every task **opened so far**. A row is added when the task's folder is created (`08-agent-todo-intake.md` step 2), never ahead of time; the not-yet-opened backlog lives in `06-whole-apps-task.md`. |

```json
{
  "schema_version": "1.0",
  "updated_at": "2026-09-13T09:40:00Z",
  "current_task_id": "000-task-supabase-schema-migration",
  "current_phase": "validate",
  "history_path": "agent-history/000-task-supabase-schema-migration",
  "status": "in_progress",
  "task_sequence": [
    { "id": "000-task-supabase-schema-migration", "architecture": "supabase", "status": "in_progress", "title": "Apply consolidated schema, auth, RLS" },
    { "id": "001-task-gateway-analytic-stage-skeleton", "architecture": "backend", "status": "pending", "title": "Golang gateway skeleton + Analytic stage stub" }
  ]
}
```

### 4.2 `task.json` — the per-task contract

| Field | Type | Description |
|---|---|---|
| `id` | string | Must equal the folder name. |
| `title` | string | Short human-readable title. |
| `architecture` | `"supabase"\|"backend"\|"frontend"` | **Primary** domain — see §5. Required. |
| `secondary_architecture` | array (optional) | Other domains this task touches, per §5's cross-cutting rule. |
| `created_at` | ISO-8601 string | |
| `status` | `"pending"\|"in_progress"\|"blocked"\|"done"\|"cancelled"` | |
| `depends_on` | array of task ids | Hard prerequisites; agent must not start until these are `done`. |
| `plan_refs` | array of `{doc, section}` | Pointers into the plan/schema docs this task implements. |
| `goals` | array of `{id, description, plan_ref, status, blocked_reason?}` | See §6. |
| `phases` | object | `{analyze: {file, status}, code: {...}, test: {...}, validate: {...}, result: {...}}` — `status` per phase is `"not_started"\|"in_progress"\|"done"`. |

```json
{
  "id": "000-task-supabase-schema-migration",
  "title": "Apply consolidated Supabase schema, auth, and RLS",
  "architecture": "supabase",
  "secondary_architecture": [],
  "created_at": "2026-09-13T08:00:00Z",
  "status": "in_progress",
  "depends_on": [],
  "plan_refs": [
    { "doc": "00-thinkboard-abstract-plan.md", "section": "§9 Build order — step 1" },
    { "doc": "thinkboard-schema-final.sql", "section": "full file" }
  ],
  "goals": [
    { "id": "g1", "description": "Run thinkboard-schema-final.sql as a clean migration on a fresh project", "plan_ref": "schema-final.sql", "status": "done" },
    { "id": "g2", "description": "Confirm RLS policies protect the direct-client read path per §9", "plan_ref": "§9 RLS", "status": "in_progress" },
    { "id": "g3", "description": "Flag the 3 non-plan-doc decisions (dual identity, two-layer persona, persona_disciplines extensibility) to the team", "plan_ref": "schema-rationale §Decisions not sourced from the plan doc", "status": "pending" }
  ],
  "phases": {
    "analyze": { "file": "analyze.json", "status": "done" },
    "code": { "file": "code.json", "status": "done" },
    "test": { "file": "test.json", "status": "done" },
    "validate": { "file": "validate.json", "status": "in_progress" },
    "result": { "file": "result.json", "status": "not_started" }
  }
}
```

### 4.3 `analyze.json`

| Field | Type | Description |
|---|---|---|
| `task_id`, `phase` | string | `phase` is always `"analyze"`. |
| `started_at` / `completed_at` | ISO-8601 | |
| `sources_read` | array of `{doc, section}` | Every doc/section actually opened — this **is** the "read" step; skipping it is a contract violation. |
| `scope` | string | What this task will and won't touch. |
| `acceptance_criteria` | array of strings, each tagged with a `goal_id` | Ties directly back to `task.json.goals`. |
| `open_questions` | array of strings | Anything ambiguous — in particular anything overlapping the schema rationale doc's "Decisions not sourced from the plan doc" list must be raised here, not silently resolved. |
| `risks` | array of strings | |

```json
{
  "task_id": "000-task-supabase-schema-migration",
  "phase": "analyze",
  "started_at": "2026-09-13T08:00:00Z",
  "completed_at": "2026-09-13T08:20:00Z",
  "sources_read": [
    { "doc": "thinkboard-schema-final.sql", "section": "full file" },
    { "doc": "01-thinkboard-schema-rationale.md", "section": "§0-§10 + Decisions not sourced from the plan doc" }
  ],
  "scope": "Migration + RLS only. No seed data beyond what's already in the SQL file. No gateway or frontend work.",
  "acceptance_criteria": [
    { "goal_id": "g1", "text": "Migration runs clean on a fresh Supabase project with no manual fixes." },
    { "goal_id": "g2", "text": "Every table has RLS enabled and a policy that matches §9's team-membership access model." }
  ],
  "open_questions": [
    "Dual-identity model (profiles + profile_identities) is an implementation decision, not plan-doc-sourced — confirm the dual-login UX it implies before other tasks build on it."
  ],
  "risks": [
    "persona_disciplines extensibility is untested beyond the seeded 'psychology' row."
  ]
}
```

### 4.4 `code.json`

| Field | Type | Description |
|---|---|---|
| `task_id`, `phase` | string | `phase` is always `"code"`. |
| `started_at` / `completed_at` | ISO-8601 | |
| `files_changed` | array of `{path, action, summary}` | `action` ∈ `created\|modified\|deleted`. |
| `decisions` | array of strings | Implementation choices made during coding that weren't already in `analyze.json`. |
| `commands_run` | array of strings | |

### 4.5 `test.json`

| Field | Type | Description |
|---|---|---|
| `task_id`, `phase` | string | `phase` is always `"test"`. |
| `test_files` | array of paths | |
| `commands_run` | array of `{command, result}` | |
| `summary` | `{total, passed, failed, skipped}` | |
| `coverage_notes` | string | Per plan §6: pipeline-stage transitions and the context-warning heuristic are explicitly called out as the parts "hard to eyeball-QA" — a task touching either must not reach `validate` with `summary.total: 0`. |

### 4.6 `validate.json`

| Field | Type | Description |
|---|---|---|
| `task_id`, `phase` | string | `phase` is always `"validate"`. |
| `goal_checks` | array of `{goal_id, status: "pass"\|"fail", notes}` | One entry per `task.json.goals` id — must cover all of them. |
| `cross_check_against_plan` | array of `{doc, section, result}` | Explicit re-read of the relevant plan/schema section to confirm the implementation still matches it. |
| `signed_off` | boolean | Only `true` once every `goal_checks` entry is `"pass"` or its matching goal is `"blocked"`. |
| `issues_found` | array of strings | |

### 4.7 `result.json`

| Field | Type | Description |
|---|---|---|
| `task_id`, `phase` | string | `phase` is always `"result"`. |
| `closed_at` | ISO-8601 | |
| `final_status` | `"done"\|"blocked"\|"cancelled"` | |
| `goals_summary` | `{total, done, blocked}` | Recomputed from `task.json.goals` at close time, not copy-pasted from memory. |
| `artifacts` | array of paths | Files/migrations/PRs this task produced. |
| `follow_up_tasks` | array of task ids | New tasks spawned (e.g. an `open_question` from `analyze.json` that turned into its own task). |

---

## 5. Architecture categorization

Every task declares exactly one **primary** `architecture`, matching Lite's three real subsystems
(`01-thinkboard-lite-spec.md` §4.1):

| Value | Covers | Repo location |
|---|---|---|
| `supabase` | Schema/migrations, RLS policies, auth config, Vault secrets, Realtime/storage config | `thinkboard-supabase/` migrations; the spec is `02-database-architecture.md` §8.1 |
| `backend` | The four command endpoints, pipeline stages, LLM adapter / key routing, memory — **no Go gateway in Lite** | `frontend-thinkboard-lite/src/server/**` + `src/app/api/v1/**` |
| `frontend` | The Next.js app: workspace shell, PDF canvas, highlights, notes, sheets, results, sync, offline | `frontend-thinkboard-lite/src/**` |

Cross-cutting tasks (e.g. 021 leader import, which needs a React review screen and a server batch) declare their dominant/owning side as `architecture` and list the other in
`secondary_architecture` — they stay **one task, one folder**, not two, unless the two halves
have genuinely independent acceptance criteria and could ship separately.

---

## 6. Goal tracking

- `task.json.goals[].status` ∈ `pending | in_progress | done | blocked` (`blocked` requires
  `blocked_reason`).
- A task cannot enter `validate` while any goal is `pending`/`in_progress` — every goal must be
  `done` or explicitly `blocked` before validation starts, so validation is always checking a
  claim, not an aspiration.
- `validate.json.goal_checks` must contain one entry per goal id — validation isn't complete
  until every goal has been individually checked off, not just the task as a whole.
- `result.json.goals_summary` is recomputed from `task.json` at close time — it is never
  hand-copied — so the two files can't silently drift apart.
- `running-process.json.task_sequence` only carries top-level task `status`, never individual
  goals — full goal detail has exactly one home, `task.json`, to avoid two sources of truth.

---

## 7. Workflow rules, phase by phase

1. **Analyze** — Read `plan_refs` and any existing related code first (this *is* the "read"
   step). Write `scope`, `acceptance_criteria` tied to goal ids, and `open_questions` — every D-, Q-
   and DB-Q- item the task touches (registry: `todo-task-000-split.md` §4.1) gets listed here, never
   silently decided.
2. **Code** — Implement only what `analyze.json.acceptance_criteria` covers. If scope needs to
   grow mid-task, that growth becomes a new task (`follow_up_tasks` at result time), not a scope
   change in-flight.
3. **Test** — Write/run tests; a task touching pipeline-stage transitions or RLS cannot reach
   `validate` with zero automated tests (`06-whole-apps-task.md` §5 rule 3).
4. **Validate** — Check code + tests against every goal and against the relevant plan/schema
   section. `signed_off: true` only once every goal is accounted for.
5. **Result** — Close the task: write `result.json`, flip `task.json.status`, advance
   `running-process.json.current_task_id` to the next task in `task_sequence`.

---

## 8. Task backlog

The backlog is [`06-whole-apps-task.md`](06-whole-apps-task.md) — 25 tasks, `000`–`024`, phases A–F
(D-05 / DB-Q5, confirmed by the owner 2026-09-18). Each task has a plan doc at the repo root,
`todo-task-NNN-<slug>.md`, which carries its goals, gate, open decisions and a ready `task.json` /
`analyze.json` / `validate.json` skeleton. The Full-era backlog that stood here is superseded; its record is
`claude-artifact/02-working.md`.

---

## 9. Worked example (abbreviated)

`agent-history/running-process.json` while task 000 is mid-validate:

```json
{
  "schema_version": "1.0",
  "updated_at": "2026-09-20T09:40:00Z",
  "current_task_id": "000-task-architecture-contract",
  "current_phase": "validate",
  "history_path": "agent-history/000-task-architecture-contract",
  "status": "in_progress",
  "task_sequence": [
    { "id": "000-task-architecture-contract", "architecture": "frontend", "status": "in_progress", "title": "Architecture contract: blueprint, AGENTS.md, verify script, lint rules" }
  ]
}
```

`task.json` and `analyze.json` for this task are given in full in `todo-task-000-split.md` §7 —
`code.json`, `test.json`, `validate.json` and `result.json` follow §4.4–§4.7 here, populated as each
phase actually completes.
