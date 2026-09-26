---
doc_id: thinkboard-lite-task-033
title: Task 033 — Live browser mount fixes (page stage)
version: "1.0"
status: done
updated: 2026-09-26
task: "033"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["03-frontend-architecture.md", "04-frontend-folder-architecture.md", "task-review-2026-09-25.md"]
authority: "Scope and contract for task 033 only."
---

# Task 033 — Live browser mount fixes

`033-task-live-mount-fixes` · `frontend` · phase G — Integration · depends on [`009`](todo-task-009-pdf-canvas.md), [`010`](todo-task-010-text-highlight.md), [`031`](todo-task-031-peer-cursors.md) · blocks — (found while live-testing)

**Main goal —** the composed workspace document actually works in a browser: the Konva page stage mounts, and text can be selected.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Explanatory** | §1, §4–§6. |
| **Do not** | Re-enable selection while a draw tool is armed; render a page twice into one canvas. |

---

## 1. What can go wrong

- pdfjs refuses two `render()` calls on one canvas. React's dev double-effect — and any real page/zoom change — starts the next paint before the previous finished, so `pageSize` never leaves 0 and the Konva stage never mounts: peer cursors, the highlight layer and the marquee all silently disappear.
- `user-select` is inherited. The page stage's `select-none` (there so a gesture never selects text) reaches pdfjs's text layer, and a text layer that cannot be selected makes task 010's whole input impossible.

Both are invisible to the unit tests: jsdom neither cancels a pdfjs render nor performs CSS selection.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | `renderPage`/`renderTextLayer` cancel an in-flight render through an `AbortSignal`; `usePageStage` aborts on cleanup, so a page/zoom change or the dev double-effect never collides. |
| **g2** | The page stage's text layer is `select-text` while no draw tool is armed, and `select-none` while one is. |
| **g3** | Unit tests pin both: the paint aborts on unmount, and the text layer's select class follows `drawing`. |
| **g4** | The docs record the fixes; the one defect *not* fixed is raised as an open question instead. |

**Gate.** `npm run verify` green, and — in the live browser — the Konva stage mounts, a peer cursor arrives, and selecting text creates a highlight that syncs.

---

## 3. Contract scaffolding

- Change `@shared/lib/pdf` (the one pdfjs seam), `@shared/components/canvas/page-stage`, and their tests. Nothing else.
- The abort is the caller's signal; `usePageStage` owns one `AbortController` per effect run.
- `renderTextLayer` cancels with the same signal, so a replaced page leaves no half-built layer.

---

## 4. Decisions

- **Cancel, don't guard.** A "skip if already rendering" flag would drop the *new* page; cancelling the *old* render is what keeps the last paint correct.
- **Selection follows the tool.** `select-text` is the default (the common case is reading and highlighting); arming a tool flips it back, so a marquee/freehand stroke never selects text.

---

## 5. Evidence (live)

- The dev log's `Cannot use the same canvas during multiple render() operations` disappeared; `.konvajs-content` appeared (two layers).
- A leader cursor dispatched in one isolated browser context reached a teammate's canvas in **~70 ms** (canvas checksum + wall clock).
- Selecting text on `example_notes.pdf` wrote a `highlights` row (`h-p01-01-qer9m6`), and a note on it wrote a `highlight_notes` row — both synced to Supabase.

---

## 6. Open question (not fixed here)

**PresenceProvider passes `page: 0`.** `usePresence` suppresses the "Leader is drawing" indicator unless `cursor.page === pageRef.current`, and the provider hardcodes `page: 0` while cursors carry the real page (1-based), so the indicator can never fire live (015 g4 / 028). Fixing it needs a *source* for "the current page" — the document viewer renders every page at once, so it is a design choice, not a bug-fix: raise it, do not pick.
