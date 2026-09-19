---
doc_id: thinkboard-lite-task-004
title: Task 004 — Conform the frontend scaffold
version: "1.0"
status: done — 6/6 goals (2026-09-19), see agent-history/004-task-frontend-scaffold/
updated: 2026-09-18
task: "004"
phase: "C — Frontend foundation"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["todo-task-000-split.md", "02-database-architecture.md"]
authority: "Scope and contract for task 004 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 004 — Conform the frontend scaffold

`004-task-frontend-scaffold` · `frontend` · phase C — Frontend foundation · depends on [`000`](todo-task-000-split.md) · blocks [`005`](todo-task-005-design-system.md), [`006`](todo-task-006-entities-kernel.md)

**Main goal —** The existing scaffold obeys the folder law, so no later task has to retrofit it.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 goals and gate, §3 decisions, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §4–§6. Context for *how*; not requirements. |
| **Starts when** | C9: `create-next-app` already ran. This task **conforms** that scaffold — it does not create a new one. |
| **On conflict** | `07-agent-working.md` wins on process, `01-thinkboard-lite-spec.md` on product intent, `02-database-architecture.md` on schema, `todo-task-000-split.md` §3.0 on who decides. This file wins on the scope of task 004 only. |
| **Do not** | Regenerate the scaffold. Add product code. Add a store library other than Redux Toolkit. |

---

## 1. What can go wrong

- **`npm run lint` already crashes on the untouched scaffold** (found by task 000): `eslint-config-next` 16.3.4 bundles `eslint-plugin-react` 7.37.5, which calls `context.getFilename()`, removed in ESLint 10. g4's green `lint` needs a compatible pairing first — raise the version choice, don't pick it silently.
- Next 16 differs from training data — read node_modules/next/dist/docs/ before touching config (AGENTS.md).
- Aliases declared once instead of twice: works in dev, fails in test (I7).
- shadcn add writes multi-part blocks to the components alias; check nothing domain-flavoured lands in template/.
- AGENTS.md's nextjs-agent-rules block is owned by Next's tooling — keep it when task 000 package C rewrites the file.

---

## 2. Goals and gate

- `g1` Conform the existing scaffold (C9): move app/, components/, lib/, hooks/ under src/; four aliases in tsconfig.json AND vitest.config.mts; spread eslint.architecture.mjs into the existing eslint.config.mjs. *(tasks 004 g1; split C9, g17)*
- `g2` src/{app,features,shared} skeleton; components.json rebound to the three tiers (ffa §5.1). *(tasks 004 g2; ffa §2, §5.1)*
- `g3` Vitest (jsdom + fake-indexeddb) and Storybook + Playwright wired. *(tasks 004 g3; ffa §10)*
- `g4` npm scripts: verify:arch = node scripts/verify-architecture.mjs, lint, typecheck, test, verify. *(tasks 004 g4; split g17)*
- `g5` Serwist configured, with a note that it is disabled in dev under Turbopack. *(tasks 004 g5; spec §11 #9)*
- `g6` verify:arch green on the real, scaffolded tree — moved here from task 000. *(split g18)*

**Gate —** `npm run verify` green on the **real** tree — not an empty one.
**Blocks —** [`005`](todo-task-005-design-system.md), [`006`](todo-task-006-entities-kernel.md).

Goals beyond the plan's list carry their source in brackets: they come from the split's §6 table, the database
review (`02-database-architecture.md` §10–§11) or a resolved conflict, and are part of this task's contract.

---

## 3. Decisions and conflicts this task touches

Every row goes into `analyze.json.open_questions`. An **unanswered** row stops the goals it touches; a
*new* row is raised to the human before coding, never resolved here. States come from `todo-task-000-split.md` §4.1.

| Id | State | Default | What it means here |
|---|---|---|---|
| Q4 | defaulted | canvas leaves are a third shared tier | canvas/ is the third tier in the skeleton |
| Q5 | defaulted | Storybook stories for canvas leaves | Storybook wired now |
| C8 | resolved in split §3 | — | Redux Toolkit is the store library the skeleton expects |
| C9 | resolved in split §3 | — | conform, never regenerate |

---

## 4. Where the work lands

```
frontend-thinkboard-lite/src/{app,features,shared}/
tsconfig.json + vitest.config.mts   # the four aliases, twice
eslint.config.mjs                   # spreads eslint.architecture.mjs
components.json, next.config.ts (Serwist), package.json scripts
.storybook/, playwright config
```

Placement follows `04-frontend-folder-architecture.md` §8; anything that does not fit is a question, not a new folder.

---

## 5. Tests that must exist

- one jsdom test, one fake-indexeddb test, one story test
- verify:arch on the real tree
- verify:arch fails without src/

---

## 6. Hand-offs

- 005 composes atoms into the new tiers
- 006 writes the Dexie kernel into src/features/entities

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4. Open the folder only through the main gate in `README.md`.

### 7.1 `agent-history/004-task-frontend-scaffold/task.json`

```json
{
  "id": "004-task-frontend-scaffold",
  "title": "The existing scaffold obeys the folder law, so no later task has to retrofit it",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": ["000-task-architecture-contract"],
  "plan_refs": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 004"},
    {"doc": "todo-task-000-split.md", "section": "§3 C9, §2 package E"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§2, §5.1, §10"},
    {"doc": "03-frontend-architecture.md", "section": "§1 stack"},
    {"doc": "todo-task-004-frontend-scaffold.md", "section": "§2 goals and gate, §3 decisions"}
  ],
  "goals": [
    {"id": "g1", "description": "Conform the existing scaffold (C9): move app/, components/, lib/, hooks/ under src/; four aliases in tsconfig.json AND vitest.config.mts; spread eslint.architecture.mjs into the existing eslint.config.mjs", "plan_ref": "tasks 004 g1; split C9, g17", "status": "pending"},
    {"id": "g2", "description": "src/{app,features,shared} skeleton; components.json rebound to the three tiers (ffa §5.1)", "plan_ref": "tasks 004 g2; ffa §2, §5.1", "status": "pending"},
    {"id": "g3", "description": "Vitest (jsdom + fake-indexeddb) and Storybook + Playwright wired", "plan_ref": "tasks 004 g3; ffa §10", "status": "pending"},
    {"id": "g4", "description": "npm scripts: verify:arch = node scripts/verify-architecture.mjs, lint, typecheck, test, verify", "plan_ref": "tasks 004 g4; split g17", "status": "pending"},
    {"id": "g5", "description": "Serwist configured, with a note that it is disabled in dev under Turbopack", "plan_ref": "tasks 004 g5; spec §11 #9", "status": "pending"},
    {"id": "g6", "description": "verify:arch green on the real, scaffolded tree — moved here from task 000", "plan_ref": "split g18", "status": "pending"}
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
  "task_id": "004-task-frontend-scaffold",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 004"},
    {"doc": "todo-task-000-split.md", "section": "§3 C9, §2 package E"},
    {"doc": "04-frontend-folder-architecture.md", "section": "§2, §5.1, §10"},
    {"doc": "03-frontend-architecture.md", "section": "§1 stack"},
    {"doc": "todo-task-004-frontend-scaffold.md", "section": "full file"}
  ],
  "scope": "Restructure the existing scaffold into the folder law and wire the tooling. No product code. Out of scope: Regenerate the scaffold. Add product code. Add a store library other than Redux Toolkit.",
  "acceptance_criteria": [
    {"goal_id": "g1", "text": "No root app/ components/ lib/ hooks/ remain; I7 passes; the architecture lint array is active."},
    {"goal_id": "g2", "text": "components.json aliases point at src/shared/components/{ui,template} and src/shared/lib."},
    {"goal_id": "g3", "text": "One trivial test per environment runs green."},
    {"goal_id": "g4", "text": "npm run verify runs all four and fails if any fails."},
    {"goal_id": "g5", "text": "A production build registers the service worker."},
    {"goal_id": "g6", "text": "verify:arch exits 0 on this tree and exits 1 when src/ is removed."}
  ],
  "open_questions": ["Q4 (defaulted: canvas leaves are a third shared tier) — canvas/ is the third tier in the skeleton.", "Q5 (defaulted: Storybook stories for canvas leaves) — Storybook wired now.", "C8 — Redux Toolkit is the store library the skeleton expects.", "C9 — conform, never regenerate."],
  "risks": ["Next 16 differs from training data — read node_modules/next/dist/docs/ before touching config (AGENTS.md).", "Aliases declared once instead of twice: works in dev, fails in test (I7).", "shadcn add writes multi-part blocks to the components alias; check nothing domain-flavoured lands in template/.", "AGENTS.md's nextjs-agent-rules block is owned by Next's tooling — keep it when task 000 package C rewrites the file."]
}
```

### 7.3 `validate.json` — 6 goal checks, no exceptions

```json
{
  "task_id": "004-task-frontend-scaffold",
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
    {"doc": "06-whole-apps-task.md", "section": "PHASE C · 004", "result": ""},
    {"doc": "todo-task-000-split.md", "section": "§3 C9, §2 package E", "result": ""},
    {"doc": "04-frontend-folder-architecture.md", "section": "§2, §5.1, §10", "result": ""},
    {"doc": "03-frontend-architecture.md", "section": "§1 stack", "result": ""}
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 Intake entry — when a human asks for this task

`agent-thinking/tracking-todo.json`, alongside `agent-thinking/todo/004-todo-frontend-scaffold/contract.json`:

```json
{
  "id": "004-todo-frontend-scaffold",
  "name": "Conform the frontend scaffold",
  "goal": "The existing scaffold obeys the folder law, so no later task has to retrofit it.",
  "todo_path": "agent-thinking/todo/004-todo-frontend-scaffold/contract.json",
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

`06-whole-apps-task.md` PHASE C · 004, `todo-task-000-split.md` §3 C9, §2 package E, `04-frontend-folder-architecture.md` §2, §5.1, §10, `03-frontend-architecture.md` §1 stack. Shorthand in `plan_ref`s: **tasks** = `06-whole-apps-task.md`, **spec** = `01-thinkboard-lite-spec.md`,
**db** = `02-database-architecture.md`, **fa** = `03-frontend-architecture.md`, **ffa** =
`04-frontend-folder-architecture.md`, **v2** = `05-frontend-sync-handwriting.md`, **split** = `todo-task-000-split.md`.
