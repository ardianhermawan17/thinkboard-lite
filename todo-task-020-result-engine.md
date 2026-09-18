---
doc_id: thinkboard-lite-task-020
title: Task 020 — Result engine
version: "1.0"
status: proposed
updated: 2026-09-18
task: "020"
phase: "E — Backend"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 020 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 020 — Result engine

`020-task-result-engine` · `backend` · phase E — Backend · depends on [`014`](todo-task-014-result-ui-against-stub.md), [`018`](todo-task-018-llm-adapter.md), [`019`](todo-task-019-mini-conclusion.md) · blocks [`023`](todo-task-023-pilot-hardening.md)

**Main goal —** Individual and group results are produced, scored and rendered from real data.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | When every task in `depends_on` shows `done` in `agent-history/running-process.json`. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 020 only. |
| **Do not** | Emit temperature from the model. Touch the frontend. |

---

## 1. What can go wrong

- Stage transitions cannot reach validate with zero tests (tasks §5 rule 3).
- Writes rely on the run-cluster policies (DB-F7) — a denial here is a 001 finding.

---

## 2. Goals and gate

- `g1` Three stages via the registry: scope_anchor → analytic → result; one file, one registry entry, one transition test each. *(tasks 020 g1; spec RULE-21)*
- `g2` Individual run: own notes + own persona + goal. Group run: group notes + promoted notes + leader notulen + workspace persona. *(tasks 020 g2; spec §5.5)*
- `g3` owner_profile_id set or null; all mini-conclusions batched into ONE prompt. *(tasks 020 g3)*
- `g4` Rule-based temperature (backers, corroborating authors, limitation notes, text-layer vs OCR). *(tasks 020 g4; spec §5.5)*
- `g5` run_renderings: descriptive markdown and visualize mermaid. *(tasks 020 g5)*
- `g6` SSE stream over a detached context so a dropped socket does not kill the run. *(tasks 020 g6)*

**Gate —** Swap task 014's stub for the real engine with **no frontend change**. That is the proof the seam was right.
**Blocks —** [`023`](todo-task-023-pilot-hardening.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-03 | defaulted | group result is leader-only | group runs leader-only |
| RULE-06 | standing rule (spec §3) | — | results are snapshots |
| D-12 | **unanswered** | — | inherited through 018 |

---

## 4. Where the work lands

```
src/server/pipeline/{service,temperature}.ts
src/server/pipeline/stages/{registry,scope-anchor,analytic,result}.ts
src/app/api/v1/{workspaces/[id]/results,runs/[id]/stream}/route.ts
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- three transition tests
- temperature formula
- detached SSE survives disconnect

---

## 6. Hand-offs

- 023 queues and surfaces runs under real quota

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/020-task-result-engine/task.json`

```json
{
  "id": "020-task-result-engine",
  "title": "Individual and group results are produced, scored and rendered from real data",
  "architecture": "backend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["014-task-result-ui-against-stub", "018-task-llm-adapter", "019-task-mini-conclusion"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 020"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5, RULE-06, RULE-21"},
    {"doc": "02-database-architecture.md", "section": "§5, §8.1"},
    {"doc": "todo-task-020-result-engine.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Three stages via the registry: scope_anchor → analytic → result; one file, one registry entry, one transition test each", "plan_ref": "tasks 020 g1; spec RULE-21", "status": "pending"},
    {"id": "g2", "description": "Individual run: own notes + own persona + goal. Group run: group notes + promoted notes + leader notulen + workspace persona", "plan_ref": "tasks 020 g2; spec §5.5", "status": "pending"},
    {"id": "g3", "description": "owner_profile_id set or null; all mini-conclusions batched into ONE prompt", "plan_ref": "tasks 020 g3", "status": "pending"},
    {"id": "g4", "description": "Rule-based temperature (backers, corroborating authors, limitation notes, text-layer vs OCR)", "plan_ref": "tasks 020 g4; spec §5.5", "status": "pending"},
    {"id": "g5", "description": "run_renderings: descriptive markdown and visualize mermaid", "plan_ref": "tasks 020 g5", "status": "pending"},
    {"id": "g6", "description": "SSE stream over a detached context so a dropped socket does not kill the run", "plan_ref": "tasks 020 g6", "status": "pending"}
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
  "task_id": "020-task-result-engine",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 020"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5, RULE-06, RULE-21"},
    {"doc": "02-database-architecture.md", "section": "§5, §8.1"},
    {"doc": "todo-task-020-result-engine.md", "section": "full file"}
  ],
  "scope": "The three-stage engine, temperature, renderings, SSE. Out of scope: Emit temperature from the model. Touch the frontend.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "Three transition tests exist."},
    {"goal_id": "g2", "text": "Input sets match spec §5.5's table."},
    {"goal_id": "g3", "text": "One model call per run."},
    {"goal_id": "g4", "text": "Formula unit-tested against spec §5.5."},
    {"goal_id": "g5", "text": "Both renderings written per run."},
    {"goal_id": "g6", "text": "Closing the stream mid-run still completes the run."}
  ],
  "open_questions": ["D-03 (defaulted: group result is leader-only) — group runs leader-only.", "RULE-06 — results are snapshots.", "D-12 (unanswered) — inherited through 018."],
  "risks": ["Stage transitions cannot reach validate with zero tests (tasks §5 rule 3).", "Writes rely on the run-cluster policies (DB-F7) — a denial here is a 001 finding."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "020-task-result-engine",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 020", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§5.5, RULE-06, RULE-21", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§5, §8.1", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/020-todo-result-engine/contract.json`:

```json
{
  "id": "020-todo-result-engine",
  "name": "Result engine",
  "goal": "Individual and group results are produced, scored and rendered from real data.",
  "todo_path": "agent-thinking/todo/020-todo-result-engine/contract.json",
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

`06-whole-apps-task.md` PHASE E · 020, `01-thinkboard-lite-spec.md` §5.5, RULE-06, RULE-21, `02-database-architecture.md` §5, §8.1. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
