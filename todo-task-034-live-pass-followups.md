---
doc_id: thinkboard-lite-task-034
title: Task 034 — Live-pass follow-ups (leader indicator, offline resume, import rung 2)
version: "1.0"
status: done
updated: 2026-09-26
task: "034"
phase: "G — Integration"
extends: ["06-whole-apps-task.md", "07-agent-working.md"]
companion: ["03-frontend-architecture.md", "05-feature-architecture.md", "task-review-2026-09-25.md"]
authority: "Scope and contract for task 034 only."
---

# Task 034 — Live-pass follow-ups

`034-task-live-pass-followups` · `frontend` · phase G — Integration · depends on [`015`](todo-task-015-realtime-presence.md), [`016`](todo-task-016-offline-and-export.md), [`021`](todo-task-021-leader-import.md), [`032`](todo-task-032-import-existing.md) · blocks — (three findings from the browser pass)

**Main goal —** the three gaps the 033 browser pass raised are closed: the leader indicator can fire, the offline resume actually syncs, and a flattened-highlight document imports.

---

## 0. How an agent should read this file

| | | |
|---|---|---|
| **Normative** | §2 goals and gate, §3 contract. Implement exactly. |
| **Informative** | §1, §4–§6. |
| **Do not** | Let presence import the viewport slice (I3); resync on a reconnect without the user's action (016 g1); run OCR for an annotation or a flattened mark (RULE-19). |

---

## 1. What was wrong

- **a.** `PresenceProvider` passed `page: 0` to `usePresence`, whose leader check compares `cursor.page === pageRef.current`. Cursors carry a 1-based page, so the "Leader is drawing" indicator (015 g4/028) could never fire.
- **b.** The banner's `Sync now` dispatches `manualOfflineSet(false)`, which sets `sync.phase` *directly*, but the sync listener's predicate was keyed on `action.type === "sync/phaseChanged"`. The reconnect cycle never ran: outbox ops stayed `queued` with `attempts: 0` forever. `networkDownSet(true)` had the same gap on the way down.
- **c.** 032 mounted rung 1 only. A document whose highlights are painted into the page (no annotations) imported nothing, though 021's `flattenedCandidates` existed.

---

## 2. Goals and gate

| Goal | What it claims |
|---|---|
| **g1** | The document view mirrors its current page into the shared workspace context; presence reads it there, so the leader indicator fires for a cursor on the current page. |
| **g2** | The sync listener reacts to any change of `sync.phase`, so `manualOfflineSet(false)` (and `networkDownSet`) run/cancel the cycle. |
| **g3** | `useImportSource` runs rung 1 per page and falls back to rung 2 (rasterize + colour mask + text-layer intersect) when a page has no annotations. |
| **g4** | The docs and board record all three, each with its live evidence. |

**Gate.** `npm run verify` green, plus live proof of each: the indicator raises then clears; an offline write stays local, reconnect does not auto-sync, `Sync now` pushes it; a flattened fixture scans to a candidate that imports.

---

## 3. Contract scaffolding

- The page mirror is a **shared** seam (the 026 `WorkspaceProvider`), because presence may not import the document feature (I3) and `src/app/` may not read the store (I4). The viewport slice stays the source; the context mirrors it.
- The sync fix is the predicate only — one line of behaviour, no protocol change.
- Rung 2 reuses 021's `flattenedCandidates`; the raster comes from a new `pageImageData` in the pdf seam (`shared/lib/pdf`), which returns null where no 2D context exists.

---

## 4. Decisions

- **Watch the state, not the action.** Any action that changes `sync.phase` must trigger the listener; keying on one action type is what broke resume.
- **Rung 1 short-circuits.** A page with annotations never pays for a raster; the ladder stops at the first rung that finds marks.
- **No OCR in rungs 1/2.** The text layer supplies exact text; rung 3 (OCR crops) stays the follow-up.

---

## 5. Evidence (live)

- **a.** In two isolated contexts, the teammate's rail showed "Leader is drawing" on the leader's cursor and cleared via the idle fallback.
- **b.** CDP Offline: banner "Offline · 1 change to sync", server count unchanged; reconnect "Back online · 1 change to sync" with no auto-resync (server still unchanged); `Sync now` pushed it (5 → 6 rows).
- **c.** A generated fixture with a flattened yellow mark scanned to one candidate and imported a group highlight "A flattened highlight line" (`text_layer`, confidence 1.0). The pale green mark was correctly ignored (saturation below the mask's 0.35 threshold).

---

## 6. Note for the import gate

`example_notes.pdf` has neither annotations nor mask-hue fills, so it exercises **neither** rung; it is a text-highlight fixture. A flattened fixture (or a real Acrobat-exported PDF) is what rungs 2/3 need. Rung 3 (a scan → OCR crops) remains open.
