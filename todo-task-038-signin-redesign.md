---
doc_id: thinkboard-lite-task-038
title: Task 038 — Sign-in screen ("the reading room")
version: "1.0"
status: done
updated: 2026-09-26
task: "038"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["05-feature-architecture.md", "todo-task-036-motion.md", "todo-task-037-web-identity-a11y.md"]
authority: "Scope and contract for task 038 only."
---

# Task 038 — Sign-in screen

`038-task-signin-redesign` · `frontend` · phase G — Integration · depends on [`005`](todo-task-005-design-system.md), [`036`](todo-task-036-motion.md) · blocks —

**Main goal —** the first screen shows the product and gives a first-class form, without regressing accessibility.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Put credentials or "demo account" hints in the UI; use `opacity: 0` entrances; add hooks to the `.tsx` (I2). |

---

## 1. What was there

A centred shadcn `Card` with a title, two placeholder-only inputs and a button. It worked, but it said nothing about
the product, and its only form affordance was the browser's.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | A two-column screen: a brand side carrying the product's own motif, and the form. Tokens only, correct in light and dark, and the brand side is hidden below `lg` so the form is never below the fold. |
| **g2** | Real form UX: `<label>` per field, correct `autoComplete`, a show/hide password control, a pending state on submit, and the error as `role="alert"`. |
| **g3** | Motion: a staggered entrance for the form and an ambient loop in the motif — transform-only, so `MotionConfig reducedMotion="user"` settles it. |
| **g4** | `npm run verify` green; the page audited at 1.00 with no failing audits; signing in still lands in the workspace. |

**Gate.** verify + a Lighthouse run on the sign-in page + a successful sign-in.

---

## 3. Contract scaffolding

- Everything lives in `features/workspace/components/auth-guard/` (the container that already owned sign-in). The
  motif is a private, non-exported component in the same `.tsx`; the screen's state goes in `use-auth-guard.ts`
  because a `.tsx` with a sibling `use-*.ts` keeps no hooks (I2).
- Motion comes from `@shared/lib/motion` (task 036's seam), never `motion/react` directly.

---

## 4. Design decisions

- **Direction: "the reading room".** The brand side draws the product's vocabulary — a page, a highlight sweeping
  across a line, a teammate's cursor drifting after it, a note chip, and a "2 here" presence pill. It is the
  product, not a stock abstract.
- **One `h1`.** "Sign in" is the only heading; the brand wordmark is a styled paragraph, so the outline is correct
  on every viewport (the brand side is `hidden` below `lg`).
- **Atmosphere from tokens.** Two blurred glows (`bg-primary/10`, `bg-highlight-yellow/20`) over `bg-muted/30` —
  depth without a stock gradient, and it follows the theme.
- **No credentials in the UI.** The pilot's seeded accounts stay in the seed; a hint in the product would ship to
  production.

---

## 5. Evidence

- `npm run verify`: **374 passed / 14 skipped**, arch 18/0, lint 0 errors, typecheck clean.
- **jev-ultrafast Lighthouse on the sign-in page (desktop): Accessibility 1.00, Best Practices 1.00, SEO 1.00, zero
  failing audits.**
- Signed in with the new form against the live stack: the form submitted, no error alert, and the workspace opened
  at `/w/f05e17f9-…` with the presence rail mounted.
- Structure read back from the live page: one `h1` ("Sign in"), `label` Email + Password, `autocomplete`
  `username`/`current-password`, a Show control, and a working submit.

---

## 6. Not verifiable here

The environment has no visible desktop, so screenshots fail and the *look* was checked by structure and computed
styles rather than by eye. The design should be reviewed in a browser at a wide viewport (the brand side appears at
`lg` and up).
