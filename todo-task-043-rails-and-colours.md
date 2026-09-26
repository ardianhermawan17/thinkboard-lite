---
doc_id: thinkboard-lite-task-043
title: Task 043 — Rails, colours, keyboard and the surfaces that had only inherited the theme
version: "1.0"
status: done
updated: 2026-09-27
task: "043"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["todo-task-039-ui-rework.md", "todo-task-041-first-run-tour.md", "todo-task-042-workspace-list.md"]
authority: "Scope and contract for task 043 only."
---

# Task 043 — Rails, colours, keyboard and the surfaces that had only inherited the theme

`043-task-rails-and-colours` · `frontend` · phase G — Integration · depends on `039`, `041` · blocks —

**Main goal —** the reader can shape the room they read in: fold either rail away, mark in four colours, turn pages
from the keyboard, and re-walk the tour — all without leaving the document.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Persist the rail flags or the colour choice; re-read `document`/`highlight` from another feature (I3); read the store from `src/app/` (I4). |

---

## 1. What was wrong

Three of these were small: the tour could not be walked again, the keyboard did nothing, and every highlight in the
product was the same yellow. Two were larger. The rails could not be folded at all, so a reader on a narrow screen
always paid for both. And the surfaces that were never reworked with the 039 token pass — the note sheet and its
editor, the persona editor, the export and re-import panels — still looked like the pre-rework app next to the
screens that had been polished.

The live pass then turned up a defect nobody had reported: **every page in the window was laid out at zero height
and painted at the same spot** (pages 1 and 2 on top of each other), and the selectable text layer had **no CSS at
all** — `pdfjs-dist` ships those rules in `web/pdf_viewer.css`, and the app imported no vendor CSS, so every span
flowed as one paragraph and the selectable text drifted off its page. The highlight rects were therefore captured
from a text layer that was not where the page was.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | The header walks the tour again, and it reopens at **1 / 8** — not on the step it was left on. |
| **g2** | Either rail folds from a **chevron beside its own title** and **slides** away to a thin handle; the document takes the freed width. |
| **g3** | A highlight made while the notes rail is folded says so, with an action that reopens the rail (the "notes" notification). |
| **g4** | Four highlight colours from the §5.3 tokens; a mark stores its **key**, the layer resolves it at render, and the canvas paints the chosen hue. |
| **g5** | `←` / `→` turn the page, and yield to a text field, a tablist, a slider or an open dialog (Radix's sheet is `role="dialog"`, not `aria-modal`). |
| **g6** | The un-polished surfaces (note sheet, note editor, writing check, persona editor, export, re-import) read as one system with 039. |
| **g7** | The document window lays pages out as a stack on a sized page box, and the pdf.js text layer has the stylesheet it needs, so text and highlights sit on the page they belong to. |

**Gate.** `npm run verify` green + a live pass on each goal + the two screenshots in `agent-history/043-…/`.

---

## 3. Contract scaffolding

- The rail flags live in the **shared workspace context** (`shared/providers/workspace-provider`), beside `page`:
  the shell owns the people rail, the document view owns the notes rail, and a feature may not read another
  feature's slice (I3) nor may `src/app/` read the store (I4). They are ephemeral by choice.
- The colour vocabulary is a **highlight-feature type** (`features/highlight/types/colour.ts`); the resolution to a
  CSS colour (`utils/highlight-colour.ts`) happens where Konva can receive it, because the canvas cannot read CSS
  variables and light/dark differ.
- The fold itself is a **shared template leaf** (`shared/components/template/rail-handle/`), presentational only.
- The pdf.js text-layer rules are the vendor's own subset, quoted into `globals.css` with the reason (no vendor CSS
  is imported); `renderTextLayer` sets `--total-scale-factor`, which the vendor's viewer sets and this integration
  never did.

---

## 4. Decisions

- **Fold from the title, not the header.** A chevron beside the rail's own name sits where the reader is already
  looking; the header stays bare (only the tour control joined it).
- **A handle, not a hidden switch.** A folded rail leaves a thin vertical handle with its name — the way back is
  where the way out was — instead of a header toggle that has to be found again.
- **The fold slides.** The rail stays mounted: the container's **width** and the panel's **transform** move together
  (300 ms, `cubic-bezier(0.22,1,0.36,1)`, off under reduced motion), and the handle cross-fades in. Only width and
  transform animate, so a frozen transition (a background tab) still lands on the correct state; the folded panel is
  `inert` + `aria-hidden`, not merely off-screen.
- **The mark stores a key, never a resolved colour.** `bbox.color` holds `"rose"` etc. (or `null` = default); the
  token is read at render, so a stored row follows the theme and the design tokens can move.
- **The nudge only speaks when the rail is away.** With the notes visible the highlight lands where the reader can
  see it; the toast would be noise.
- **The keyboard yields.** Anything that owns the arrows itself — inputs, tablists, sliders, an open dialog — wins.
- **Pages are a stack, centred, on a muted ground.** The window already computed a page list; the fix is to give a
  page a box, so the list reads as pages instead of a pile.

---

## 5. Evidence

- `npm run verify`: **386 passed / 15 skipped** (94 files), arch **18 pass / 0 fail**, lint **0 errors** (9
  pre-existing warnings), typecheck clean.
- **Live (dev, signed in as `admin@gmail.com`):**
  - the tour walked **1/8 → 8/8**, "Make room" spotlighted the notes rail header **exactly**
    (`headerRect = ringRect = 415,86,287,41`), and "Show the tour again" reopened at **1 / 8** after the fix;
  - the notes chevron folded the rail to a **"Notes" handle** and back; the people chevron did the same with
    **"People"**; the document area went **414 → 934 px** with both folded;
  - both folds **animate**: sampling the width each frame gives 288 → 142 → 66 → 48 → 45 px (notes) and
    320 → 155 → 69 → 48 → 45 px (people), and back 45 → 220 → 274 → 286 / 45 → 243 → 304 → 318 px, with
    `width 0.3s cubic-bezier(0.22, 1, 0.36, 1)`; the folded panel is `aria-hidden` + `inert` and the handle becomes
    reachable;
  - with the rail folded and **rose** chosen, selecting *"Pre-Class Assignment — Consumer Beh"* produced the toast
    **"Highlight added to Notes … Show notes"**, the action restored the rail, and the stored row carried
    `bbox.color = "rose"` with rects `{x 0.098, y 0.111, w 0.277, h 0.024}`;
  - the highlight layer's rose pixels measured a bounding box of **60, 88, 309 × 20 CSS px** — the stored rects,
    painted on the heading line (before this task, that text layer was not where the page was);
  - `←` / `→` stepped 1 → 2 → 1, did nothing while the note sheet was open, and did nothing from an input.
- Screenshots: `shot-workspace.jpg` (rails open, both chevrons), `shot-fullpage.jpg` (both folded, handles),
  `shot-highlight.jpg` (a rose mark on its line, the notes rail listing it).

---

## 6. Follow-ups (not in this task)

- The **page-turn transient**: a window slide can leave the previous page's canvas visible until the next paint.
- The **people rail on a narrow screen**: it has no `hidden md:*` gate of its own; folding it is the manual answer.
- A **colour dot in the notes list** so a row shows the hue it will paint.
