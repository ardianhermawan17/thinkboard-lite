---
doc_id: thinkboard-lite-task-039
title: Task 039 — UI rework ("soft structuralism")
version: "1.1"
status: done
updated: 2026-09-26
task: "039"
phase: "G — Design"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["high-end-visual-design", "design-taste-frontend", "todo-task-036-motion.md", "todo-task-037-web-identity-a11y.md", "todo-task-038-signin-redesign.md"]
authority: "Scope and contract for task 039 only."
---

# Task 039 — UI rework

`039-task-ui-rework` · `frontend` · phase G — Design · depends on [`005`](todo-task-005-design-system.md), [`036`](todo-task-036-motion.md) · blocks —

**Main goal —** one coherent, deliberate visual language across the app, applied at the token layer so every surface changes together.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§7. |
| **Do not** | Re-introduce a saturated violet primary, pure `#fff`/`#000`, `ease-in-out`/`linear` transitions, hard grey borders, or a text glyph inside an aria-labelled control. |

---

## 1. Design read (per `design-taste-frontend` §0.B)

> Reading this as: **a local-first collaborative PDF-review workspace (product UI, not a landing page), for a small field pilot on tablets**, with a **calm high-end technical** language, leaning toward **soft structuralism** on the existing shadcn + Tailwind v4 token system, IBM Plex Sans (already installed) + Geist Mono, and Motion for transform-only choreography.

Dials: `DESIGN_VARIANCE 5 / MOTION_INTENSITY 4 / VISUAL_DENSITY 5` — the asymmetric document/rail split stays, motion stays restrained (this is a tool someone reads in for 45 minutes), density stays mid.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | A new token foundation: off-white/off-black neutrals, **one desaturated petrol accent**, hairline (alpha-ink) borders, a documented radius scale, soft tinted shadows, premium easing, and a fixed grain overlay. |
| **g2** | The primitives carry the language: button (press physics, one accent), input, card (soft shadow + hairline), skeleton (shimmer), sheet (hairline + soft shadow, no `ease-in-out`). |
| **g3** | The surfaces are reworked: the sign-in screen, the "new workspace" screen, the header, the notes panel (+ a composed empty state), members (+ initials and a role chip), page controls, the presence rail, the offline banner. |
| **g4** | Nothing regresses: `npm run verify` green, and both the sign-in and workspace pages still audit at **1.00 / 1.00 / 1.00 with zero failing audits**. |

**Gate.** verify green **and** a Lighthouse run on each of the two pages with no failing audits.

---

## 3. Contract scaffolding

- Values live in `src/app/globals.css` (`:root` / `.dark` + `@theme inline`), so a token change reaches every surface at once.
- Interaction states stay in the primitives; page-level composition stays in the feature containers.
- The shape lock is written in the CSS header: **controls `--radius` 0.75rem · surfaces `--radius-xl` · pills/badges `--radius-pill`**.
- Motion comes from `@shared/lib/motion` (task 036's seam), now with the `[0.16, 1, 0.3, 1]` easing.

---

## 4. Decisions

- **The violet had to go.** The previous primary was a saturated indigo/violet — the single most recognisable "AI default" (design-taste-frontend's *LILA rule*). Replaced with **petrol** (`oklch(0.44 0.072 205)` light / `oklch(0.76 0.088 200)` dark). It is calm and does not fight the yellow/green/blue/rose highlight swatches the canvas already draws.
- **Hairlines, not grey rules.** `--border` is alpha ink (`oklch(0.23 0.012 250 / 0.1)`), so an edge reads as an edge in both themes.
- **Grain once, fixed, invisible.** A single `body::after` at `0.022` opacity, `pointer-events-none`, disabled under `prefers-reduced-transparency` — never on a scrolling container.
- **Icons thinned globally.** One rule (`svg.lucide { stroke-width: 1.5 }`) rather than touching every call site; no new icon dependency (the repo already depends on Lucide).
- **Motion stays transform-only** (task 036's hard-won constraint: an `opacity: 0` entrance hides a background tab).
- **A text glyph is a text glyph.** `⟳ Rotate` failed `label-content-name-mismatch` because axe counts the character in the visible label; the chevrons/rotate glyphs are now aria-hidden Lucide icons.

---

## 5. Evidence

- `npm run verify`: **374 passed / 14 skipped**, arch 18/0, lint 0 errors, typecheck clean.
- Live tokens read from the running app: body `oklch(0.17 0.008 250)`, primary `oklch(0.76 0.088 200)`, border `oklch(1 0 0 / 0.09)`, radius `0.75rem`, CTA pill `9999px`/44 px, grain present, font IBM Plex Sans.
- **jev-ultrafast Lighthouse**: sign-in page **1.00 / 1.00 / 1.00, 0 failing audits**; workspace page **1.00 / 1.00 / 1.00, 0 failing audits** (after fixing the rotate label).
- Workspace skin confirmed live: sticky header with `backdrop-filter: blur(12px)`, sidebar-tinted notes panel, three member avatars.

---

## 6. Scope honesty

Reworked: tokens, six primitives, sign-in, new-workspace, header, notes panel, members, page controls, presence rail, offline banner.

Inherited-but-not-individually-reworked (they pick up the new tokens and primitives, but their own markup was not revisited): the note sheet's editor internals, the persona editor, the export/re-import panels, the dialog primitive, the tooltip/sonner toasts. Those are the natural next pass if the direction is approved.

---

## 7. Follow-ups

- A real icon set is still Lucide (thinned); a lighter family (Phosphor Light) would need a dependency decision.
- The manifest's icons are still `favicon.ico` (task 037's follow-up).
- Have a human review the look at `lg+`: this environment cannot screenshot.
