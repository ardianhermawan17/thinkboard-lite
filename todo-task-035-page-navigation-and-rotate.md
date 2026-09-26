---
doc_id: thinkboard-lite-task-035
title: Task 035 — Page navigation and rotate
version: "1.0"
status: done
updated: 2026-09-26
task: "035"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["03-frontend-architecture.md", "04-frontend-folder-architecture.md", "task-review-2026-09-25.md"]
authority: "Scope and contract for task 035 only."
---

# Task 035 — Page navigation and rotate

`035-task-page-navigation` · `frontend` · phase G — Integration · depends on [`009`](todo-task-009-pdf-canvas.md) · blocks — (closes a live-pass finding)

**Main goal —** a multi-page document is readable: step the page cursor and turn the page.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Keep a second copy of the current page (the viewport slice is the one source); rotate the overlays without the page. |

---

## 1. What was wrong

`viewport.page` and `viewport.rotation` exist in the slice, and `pageChanged`/`rotated` are defined and unit-tested — but **nothing in `src/` dispatched either**. `pageWindow` mounts `page ± 1` pages, so with the cursor pinned at 1 a multi-page document showed only pages 1–2 and could never advance; there was no rotate control at all.

Fixing the control alone would not have been enough: `renderPage`/`renderTextLayer` built their viewport with `{ scale }` only, so dispatching `rotated` would have turned the highlight/annotation layers (which normalize by rotation) but **not the base PDF render**.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | A `Page N of M` indicator plus Prev/Next that dispatch `pageChanged`; the buttons disable at the bounds; the page window follows. |
| **g2** | A quarter-turn Rotate that dispatches `rotated`, and `renderPage`/`renderTextLayer` pass the rotation to the pdfjs viewport so the page itself turns. |
| **g3** | Tests pin the dispatch, the bounds and the rotation argument. |
| **g4** | Docs and board record it with its live evidence. |

**Gate.** `npm run verify` green; in the browser, stepping a 4-page document slides the mounted window, and Rotate changes the rendered canvas shape.

---

## 3. Contract scaffolding

- The control is a **container leaf** in the document feature (`features/document/components/page-controls/`): Redux is its context (the placement tree's "does it touch Redux?" branch). Its `.tsx` keeps no hooks of its own (I2) — `use-page-controls.ts` owns them.
- It dispatches the two existing slice actions; the viewer, the window and every layer already follow the slice, so there is no second source of the current page.
- `renderPage(doc, page, canvas, scale, rotation, signal?)` and `renderTextLayer(..., rotation, signal?)` gained the argument; `usePageStage` passes its `rotation` prop.

---

## 4. Decisions

- **Prev/Next, not scroll.** The window is cursor-based; a scroll-driven cursor is a later UX choice, so the smallest honest control dispatches the cursor it already owns.
- **Rotate must render.** Passing `rotation` to the viewport is what makes the feature real; the overlays were already normalizing by it (RULE-17).

---

## 5. Evidence (live)

On a generated 4-page fixture, a fresh browser context:

| step | indicator | mounted stages | canvas |
|---|---|---|---|
| open | Page 1 of 4 (Prev disabled) | `[1, 2]` | 612×792 |
| Next | Page 2 of 4 | `[1, 2, 3]` | 612×792 |
| Next | Page 3 of 4 | `[2, 3, 4]` | 612×792 |
| Rotate | Page 3 of 4 | `[2, 3, 4]` | **792×612** |

---

## 6. Note

`pageChanged`/`rotated` are now dispatched from exactly one place. A scroll-driven cursor, a page-thumbnail strip and per-page zoom memory are all natural follow-ups but out of scope here.
