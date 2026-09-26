---
doc_id: thinkboard-lite-task-041
title: Task 041 — First-run tour (guided onboarding)
version: "1.0"
status: done
updated: 2026-09-27
task: "041"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-036-motion.md", "todo-task-039-ui-rework.md", "04-frontend-folder-architecture.md §6"]
authority: "Scope and contract for task 041 only."
---

# Task 041 — First-run tour

`041-task-first-run-tour` · `frontend` · phase G — Integration · depends on [`036`](todo-task-036-motion.md), [`025`](todo-task-025-wire-document-view.md) · blocks —

**Main goal —** someone opening the workspace for the first time is shown what it is and how to use it, once.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Put hooks in the `.tsx` (I2); re-show the tour after it has been finished; let the spotlight block the control it is explaining. |

---

## 1. What was missing

The workspace opens straight into a PDF with three tools, a notes rail, a presence rail and an Export control, and
nothing says what any of it is for. The main feature had no first-run explanation at all.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | A seven-step tour over the document view, each step naming the product's own thing (the document, the tools, the notes, importing your own highlights, the people, the export). |
| **g2** | It opens **only the first time** per account: a `tourSeen` flag on the workspace slice (persisted), set by finishing *or* skipping. |
| **g3** | The spotlight is animated with Motion (task 036's library): the hole moves, the card pops, and reduced motion collapses both. |
| **g4** | `npm run verify` green, and — live — the tour opens, walks, finishes, and does **not** reopen after a reload. |

**Gate.** verify + a live first-run, finish, reload.

---

## 3. Contract scaffolding

- `features/workspace/components/onboarding-tour/` — a container leaf: `.tsx` (pure render), `use-onboarding-tour.ts`
  (every hook: the flag, the step machine, the DOM measurement, the keyboard, focus), `types.ts`, `index.ts`, a test.
- The flag is `workspace.tourSeen` (persisted; **not** under `ui`, which `stripUi` erases — I16).
- Mounted by the app route inside `workspace-document.tsx`, beside `NotePanel`/`ImportSource`/`OnboardingTour`'s
  peers; the route itself still reads no store (I4).
- Stable targets: `data-testid` on `region-toolbar`, `page-stage`, `note-panel`, `presence-rail`,
  `import-existing`, `export-workspace`.

---

## 4. Decisions

- **A flag, not an overlay that remembers nothing.** Finishing and skipping both set it, so the tour never nags.
- **Skip is as prominent as Next**, because a returning user may have seen it once already; both are one click.
- **The scrim is clipped, not shimmed.** One `clip-path: polygon(evenodd, …)` cuts the hole, so the spotlit control
  stays clickable while everything else is blocked — the user can try the thing while it is explained.
- **CSS transitions the hole; Motion moves the ring and pops the card.** Both pause in a background tab (the same
  constraint task 036 recorded), so neither may be the only thing that makes the UI legible.

---

## 5. What the live pass taught

- The document canvas mounts **after** the workspace does, so a target can be missing when a step starts. The first
  implementation gave up after one retry and the spotlight stayed at 0; it now keeps looking (40 × 300 ms) and stops
  as soon as the target appears.
- This headless tab is hidden, so **CSS transitions and Motion springs both freeze** — the scrim's *inline* target and
  the ring's *inline* transform were correct while their computed values lagged. The live proof therefore reads
  inline styles (and the reload), not animation progress.

---

## 6. Evidence

- `npm run verify`: **379 passed / 14 skipped** (5 new tour tests), arch 18/0, lint 0 errors, typecheck clean.
- Live: the tour opened at **1 / 7 "Welcome to your workspace"**; Next walked it to "Read the document" →
  "Mark what matters"; the ring's inline geometry matched its targets exactly (stage `362×0 @ y137`; toolbar
  `665×37 @ y59`) and the scrim's clip-path held the same rectangle (`… 0px 59px, 0px 96px, 665px 96px, 665px 59px,
  0px 59px`); "Start reading" closed it; a reload did **not** reopen it, with the workspace mounted.

---

## 7. Follow-ups

- A "Show the tour again" control (e.g. in the header menu or the account panel) would let a user replay it; today
  signing out is the only reset, because `signedOut` clears the slice.
- Per-workspace instead of per-account, if the pilot wants it once per document.
- A designer's pass on the copy; it is plain on purpose.
