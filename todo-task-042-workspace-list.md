---
doc_id: thinkboard-lite-task-042
title: Task 042 — The landing screen lists your workspaces
version: "1.0"
status: done
updated: 2026-09-27
task: "042"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-008-auth-and-workspace-shell.md", "todo-task-041-first-run-tour.md"]
authority: "Scope and contract for task 042 only."
---

# Task 042 — The landing screen lists your workspaces

`042-task-workspace-list` · `frontend` · phase G — Integration · depends on [`008`](todo-task-008-auth-and-workspace-shell.md) · blocks —

**Main goal —** a returning user can open a workspace they already have, without pasting its URL.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Filter the list client-side, or treat a failed list as an error — creating a workspace must still work offline. |

---

## 1. The dead end

`/w` landed in the last workspace (RULE-14) or offered **create**. On a new device, or after a sign-out, a user with
an existing workspace had no way to reach it: the seeded pilot workspace had to be handed over as a URL. The tour
(task 041) made the workspace itself friendlier; this fixes the door to it.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | `listWorkspaces()` in `workspace-remote`: the workspaces this account can open, **scoped by RLS**, not by a client filter. |
| **g2** | The landing screen lists them (title + an arrow), keeps the create form, and adapts its heading ("Your workspaces" vs "Start a workspace"). |
| **g3** | Opening one navigates to `/w/<id>`. A failed list (offline, or not signed in yet) degrades to the create form, silently. |
| **g4** | `npm run verify` green, a live click-through, and a new live RLS test in `workspace-remote.test.ts`. |

**Gate.** verify + the live suite + a live list→open.

---

## 3. Contract scaffolding

- The read lives in `features/workspace/utils/workspace-remote.ts`, beside `teamOfSession`/`createWorkspace` — it is
  online by nature, the same as those.
- The list is loaded in `use-workspace-shell.ts` (the container hook) only while landing; the shell renders it.
- No Dexie table is involved: `sessions` is not mirrored in the local-first kernel.

---

## 4. Decisions

- **RLS is the filter.** The query is `select id, title` with no `where`: what the account may read *is* its
  workspace list. A client-side filter would be a second, weaker copy of a rule the database already enforces.
- **A read, never a write path.** Nothing here writes `meta` or the outbox; it cannot park and it cannot corrupt.
- **Silent failure by design.** If the list cannot load, the screen is exactly what it was before this task.

---

## 5. Evidence

- `npm run verify`: **379 passed / 15 skipped** (the new live test skips without the stack), arch 18/0, lint 0 errors,
  typecheck clean.
- **Live (dev, signed in fresh so no session was cached):** the landing first showed "Start a workspace", then the
  list arrived — heading **"Your workspaces"**, one row **"Placeholder report review"**, the create form still
  present; clicking the row navigated to `/w/f05e17f9-…` and the workspace mounted.
- **Live suite (`workspace-remote.test.ts`, against the seeded stack): 7/7**, including the new **g5**: the leader's
  list contains the workspace they just created; a member of the seeded team sees the seeded workspace and does
  **not** see that new team's.

---

## 6. Follow-ups

- Ordering and a timestamp ("last opened") would need a column or a local note; today the list is unordered.
- The list is read-only: no rename/delete. That is a product decision, not an oversight.
- If workspaces ever number in the dozens, this wants search and pagination.
