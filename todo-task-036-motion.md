---
doc_id: thinkboard-lite-task-036
title: Task 036 — Motion (app-level animation)
version: "1.0"
status: done
updated: 2026-09-26
task: "036"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["03-frontend-architecture.md", "04-frontend-folder-architecture.md"]
authority: "Scope and contract for task 036 only."
---

# Task 036 — Motion (app-level animation)

`036-task-motion` · `frontend` · phase G — Integration · depends on [`005`](todo-task-005-design-system.md) · blocks —

**Main goal —** the app has one orchestrated, calm entrance instead of a hard paint, and it is impossible for that motion to hide the app.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Animate a Konva canvas with Motion (it is not a DOM node); start an entrance from `opacity: 0`. |

---

## 1. What was there, and what was missing

The design system already ships `tw-animate-css` (imported in `globals.css`), and the shadcn primitives animate their
open/close through Radix `data-state` + those utilities. What was missing was **app-level orchestration**: the
workspace painted all at once. That is what Motion is for.

`motion` (v13) was added; it is a DOM animator, so the Konva z0/z1/z2 layers keep their imperative painters.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | `motion` is wrapped in one seam (`shared/lib/motion.ts`) and `MotionConfig reducedMotion="user"` is mounted once in the provider tree. |
| **g2** | A small set of high-impact entrances: the workspace open (staggered), the Members and Notes lists, the import-review rows, the offline banner, and the "Leader is drawing" chip. |
| **g3** | Tests and the full gate stay green (no test asserts an animation, and none breaks). |
| **g4** | The docs record it, including the one design constraint below. |

**Gate.** `npm run verify` green, and — live — the app renders with content **visible** at every moment.

---

## 3. Contract scaffolding

- The seam `shared/lib/motion.ts` re-exports the primitives and owns the four variants (`rise`, `stagger`,
  `riseChild`, `pop`). Components import the seam, never `motion/react` directly.
- `MotionConfig` lives in `shared/providers/index.tsx` (the one provider tree `app/` imports).
- The Konva canvas leaves are untouched (I18/I24 unaffected).

---

## 4. The design constraint: motion must never hide the app

Every entrance is **transform-only** (a few pixels of rise, or a small scale) — never `opacity: 0`.

**Why.** `requestAnimationFrame` is paused while a tab is in the background. An entrance that starts at
`opacity: 0` therefore leaves a workspace opened in a background tab **invisible until it is focused**. It was
observed here directly: in a hidden tab the shell held its start state, and with an opacity variant that start state
is invisible. With a transform-only entrance the start state is merely 8 px low — readable at every moment, and it
settles the instant frames run.

This is a real behaviour, not a test artefact: `document.visibilityState` was `"hidden"` during verification.

---

## 5. Evidence

- `npm run verify` green: **374 passed / 14 skipped**, arch 18/0, lint 0 errors, typecheck clean.
- Live, after a reload with the tab hidden: every shell child reported `opacity: 1` and `transform: translateY(8px)`
  — visible, and holding the entrance's start offset until frames run. Before the change the same probe reported
  `opacity: 0`.
- Console: only the pre-existing Next dev "script tag" warning; nothing from Motion.

---

## 6. Not done (deliberately)

No page/route transitions, no scroll reveals, no layout animations. The canvas surfaces and the note sheet's Radix
transitions already cover the rest; adding more would fight the design language rather than serve it.
