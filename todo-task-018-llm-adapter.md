---
doc_id: thinkboard-lite-task-018
title: Task 018 — LLM adapter
version: "1.0"
status: proposed
updated: 2026-09-18
task: "018"
phase: "E — Backend"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 018 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 018 — LLM adapter

`018-task-llm-adapter` · `backend` · phase E — Backend · depends on [`017`](todo-task-017-command-endpoints.md) · blocks [`019`](todo-task-019-mini-conclusion.md), [`020`](todo-task-020-result-engine.md)

**Main goal —** One model interface with provider rotation and honest accounting, so quota is a config problem rather than a code problem.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | **Blocked until D-12 is answered** (free-tier training terms vs Perhutani document sensitivity). Do not open the folder before then. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 018 only. |
| **Do not** | Use OmniRoute in the product (tasks §3). Return a key from any route. |

---

## 1. What can go wrong

- Provider #1 OpenRouter, #2 Groq, #3 own key (tasks §3) — all contingent on D-12.
- **Gap to raise:** reading a Vault secret needs privileges the user's JWT does not have, and Lite has no service-role key (RULE-01). A security-definer RPC scoped to current_profile_id() is the likely shape; it is not in db §8.1 and not yet in the split §4.1 registry.

---

## 2. Goals and gate

- `g1` llm/service.ts — complete() / stream(), taking a profileId, never a key. *(tasks 018 g1; spec RULE-24)*
- `g2` llm/providers/* — OpenAI-compatible adapters; provider list and order from config, not imports. *(tasks 018 g2; tasks §3)*
- `g3` llm/resolver.ts — own key first (Vault, resolved in vault.ts only), else the shared pool; default from profile_identities.kind. *(tasks 018 g3; spec §7)*
- `g4` llm/ratelimit.ts — on 429 fail over; when all are exhausted queue the run as pending and report when. *(tasks 018 g4)*
- `g5` llm/usage.ts — one llm_requests row per call, batched off the hot path. *(tasks 018 g5)*
- `g6` Mini-conclusion cache key (highlight.text, notes_hash, persona_id). *(tasks 018 g6)*

**Gate —** The whole provider set can be swapped by editing config. A forced 429 fails over without a user-visible error.
**Blocks —** [`019`](todo-task-019-mini-conclusion.md), [`020`](todo-task-020-result-engine.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| D-12 | **unanswered** | — | **unanswered — blocks this task** |
| *new* | to raise | — | Vault access under the user's JWT (see §1) |

---

## 4. Where the work lands

```
src/server/llm/{service,resolver,vault,usage,ratelimit}.ts
src/server/llm/providers/*
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- forced 429 failover
- all-exhausted → pending run
- usage row per call

---

## 6. Hand-offs

- 019 and 020 call only llm/service.ts

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/018-task-llm-adapter/task.json`

```json
{
  "id": "018-task-llm-adapter",
  "title": "One model interface with provider rotation and honest accounting, so quota is a config problem rather than a code problem",
  "architecture": "backend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["017-task-command-endpoints"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 018, §3"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§7, RULE-24"},
    {"doc": "02-database-architecture.md", "section": "§5"},
    {"doc": "todo-task-018-llm-adapter.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "llm/service.ts — complete() / stream(), taking a profileId, never a key", "plan_ref": "tasks 018 g1; spec RULE-24", "status": "pending"},
    {"id": "g2", "description": "llm/providers/* — OpenAI-compatible adapters; provider list and order from config, not imports", "plan_ref": "tasks 018 g2; tasks §3", "status": "pending"},
    {"id": "g3", "description": "llm/resolver.ts — own key first (Vault, resolved in vault.ts only), else the shared pool; default from profile_identities.kind", "plan_ref": "tasks 018 g3; spec §7", "status": "pending"},
    {"id": "g4", "description": "llm/ratelimit.ts — on 429 fail over; when all are exhausted queue the run as pending and report when", "plan_ref": "tasks 018 g4", "status": "pending"},
    {"id": "g5", "description": "llm/usage.ts — one llm_requests row per call, batched off the hot path", "plan_ref": "tasks 018 g5", "status": "pending"},
    {"id": "g6", "description": "Mini-conclusion cache key (highlight.text, notes_hash, persona_id)", "plan_ref": "tasks 018 g6", "status": "pending"}
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
  "task_id": "018-task-llm-adapter",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 018, §3"},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§7, RULE-24"},
    {"doc": "02-database-architecture.md", "section": "§5"},
    {"doc": "todo-task-018-llm-adapter.md", "section": "full file"}
  ],
  "scope": "The model interface, providers, key resolution, rate limiting, usage accounting. Out of scope: Use OmniRoute in the product (tasks §3). Return a key from any route.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "No caller passes a key."},
    {"goal_id": "g2", "text": "Swapping providers is a config edit."},
    {"goal_id": "g3", "text": "vault.ts is the only file touching secrets."},
    {"goal_id": "g4", "text": "A forced 429 fails over with no user-visible error."},
    {"goal_id": "g5", "text": "Row count equals call count."},
    {"goal_id": "g6", "text": "An unchanged input never re-calls."}
  ],
  "open_questions": ["D-12 (unanswered) — unanswered — blocks this task.", "NEW, to raise: Vault access under the user's JWT (see §1)"],
  "risks": ["Provider #1 OpenRouter, #2 Groq, #3 own key (tasks §3) — all contingent on D-12.", "Gap to raise: reading a Vault secret needs privileges the user's JWT does not have, and Lite has no service-role key (RULE-01). A security-definer RPC scoped to current_profile_id() is the likely shape; it is not in db §8.1 and not yet in the split §4.1 registry."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "018-task-llm-adapter",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE E · 018, §3", "result": ""},
    {"doc": "01-thinkboard-lite-spec.md", "section": "§7, RULE-24", "result": ""},
    {"doc": "02-database-architecture.md", "section": "§5", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/018-todo-llm-adapter/contract.json`:

```json
{
  "id": "018-todo-llm-adapter",
  "name": "LLM adapter",
  "goal": "One model interface with provider rotation and honest accounting, so quota is a config problem rather than a code problem.",
  "todo_path": "agent-thinking/todo/018-todo-llm-adapter/contract.json",
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

`06-whole-apps-task.md` PHASE E · 018, §3, `01-thinkboard-lite-spec.md` §7, RULE-24, `02-database-architecture.md` §5. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
