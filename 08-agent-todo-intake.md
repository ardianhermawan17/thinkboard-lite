---
doc_id: thinkboard-agent-todo-intake
title: Agent Todo Intake
status: normative
read_order_position: 8
extends: ["07-agent-working.md"]
---

# 08 — Agent Todo Intake (`agent-thinking/todo`)

This file explains how human requests become tracked implementation work in this repo, via
`agent-thinking/todo/` and its index, `agent-thinking/tracking-todo.json`.

## `agent-history` vs `agent-thinking`

- **`agent-history/`** — what an agent *has been doing* / past history. One folder per task
  (`NNN-task-<slug>/`), each with its own `analyze.json` / `code.json` / `test.json` /
  `validate.json` / `result.json` phase files (see `07-agent-working.md`). Structure is more complex
  because it's a full audit trail of *execution*.
- **`agent-thinking/todo/`** — how a raw human prompt becomes a contract-based prompt that's easy
  to implement correctly. One folder per todo (`NNN-todo-<slug>/contract.json`) holding just
  `id`, `name`, `human_prompt` (verbatim ask) and `translated_prompt_agent` (the same ask,
  rewritten as concrete steps against the actual codebase). This is *pre-execution* — it exists so
  the agent building `translated_prompt_agent` has **already read `README.md`** and the plan docs
  before an implementation task is ever opened, instead of re-deriving context mid-task.

## Three layers, one number

| Layer | Where | Written when | Holds |
|---|---|---|---|
| **Plan** | `todo-task-NNN-<slug>.md` (repo root) | ahead of time, by planning | goals, gate, decisions, ready JSON skeletons |
| **Intake** | `agent-thinking/todo/NNN-todo-<slug>/contract.json` | when a human asks for the work | the verbatim ask + the ask translated into steps |
| **Execution** | `agent-history/NNN-task-<slug>/` | when an agent starts the work | `task.json` + the five phase files |

`NNN` and `<slug>` are the same in all three — the task's id and slug from `06-whole-apps-task.md` —
so any one of them locates the other two. A contract with no plan doc is a new task: add it to
`06-whole-apps-task.md` and write its plan doc first, taking the next free `NNN`.

## `agent-thinking/tracking-todo.json`

The index of every todo contract created under `agent-thinking/todo/`. One entry per contract:

| Field | Description |
|---|---|
| `id` | Matches the todo folder name, e.g. `000-todo-architecture-contract`. |
| `name` | Short human-readable title. |
| `goal` | One-line statement of what the todo is trying to achieve. |
| `todo_path` *(optimize_for_agent)* | Plain relative path to the `contract.json`, e.g. `agent-thinking/todo/000-todo-architecture-contract/contract.json`. Kept as a bare path, not prose, so an agent can resolve it programmatically instead of parsing free text. |
| `agent_history` *(optimize_for_agent)* | Plain relative path to the matching `agent-history/NNN-task-<slug>/` folder once the todo is picked up for implementation, or `null` while it's still unstarted. Same "path, not prose" rule. |
| `status` | `"pending"` \| `"in_progress"` \| `"done"` — local status of the todo itself (separate from the `agent-history` task's own `status`). |

```json
{
  "schema_version": "1.0",
  "updated_at": "2026-09-18T00:00:00Z",
  "tracked_todos": [
    {
      "id": "000-todo-architecture-contract",
      "name": "Architecture contract, split into five packages",
      "goal": "...",
      "todo_path": "agent-thinking/todo/000-todo-architecture-contract/contract.json",
      "agent_history": null,
      "status": "pending"
    }
  ]
}
```

## Connection to `agent-history/running-process.json`

The two files are sequential, not parallel:

```
tracking-todo.json  →  running-process.json
(agent-thinking)        (agent-history)
```

1. A human prompt is turned into a contract and registered in `tracking-todo.json` first
   (`agent_history: null`, `status: "pending"`) — this is the intake queue.
2. When an agent actually starts implementing a todo, it opens a new
   `agent-history/NNN-task-<slug>/` folder per `07-agent-working.md` and adds it to
   `running-process.json`'s `task_sequence` — this is execution tracking.
3. At that point the corresponding `tracking-todo.json` entry is updated: `agent_history` is
   filled in with the new task folder's path, and `status` moves to `"in_progress"`.
4. When the task's `result.json` closes it `done`, the entry's `status` moves to `"done"` in the same
   step. A task that closes `blocked` or `cancelled` leaves its entry `in_progress` and says why in
   `result.json`.

Invariants — check them at every session start:

- every folder under `agent-thinking/todo/` has exactly one `tracking-todo.json` entry, and vice versa;
- every non-null `agent_history` path exists, and appears in `running-process.json.task_sequence`;
- every `task_sequence` row whose work came from a human ask has a tracking entry pointing at it.

`tracking-todo.json` never replaces `running-process.json` — it's what feeds it. A todo is the
contract; the `agent-history` task is the record of doing it.
