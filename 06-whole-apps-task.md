---
doc_id: thinkboard-lite-whole-apps-task
title: Whole-App Task Plan — ThinkBoard Lite
version: "1.0"
status: proposed
read_order_position: 6
extends: ["07-agent-working.md", "08-agent-todo-intake.md", "09-agent-limitation.md"]
companion: ["02-database-architecture.md", "06-whole-apps-task.html"]
---

# 06 — Whole-App Task Plan

> **Shape of every task:** one **main-goal** (the context-feature — what capability lands) and a set of
> **mini-goals** (the detail-features — what an agent actually implements). Main-goal goes in
> `task.json.title`; mini-goals become `task.json.goals[]`, one entry each, with a `plan_ref`.
>
> **Order:** architecture first, then the data contract, then the frontend, then the backend. The frontend
> runs against **real Supabase rows through RLS** from task 008 onward — no mocks — which is only possible
> because tasks 001–003 land the schema first.

---

## 0. How to read this file

| | |
|---|---|
| **ID** | `NNN-task-<slug>`, global monotonic per `07-agent-working.md` §3. Never reused. Plan id = folder id (C7, resolved 2026-09-18). |
| **Plan doc** | Every task has one at the repo root: `todo-task-NNN-<slug>.md` (task 000's is `todo-task-000-split.md`). It carries the goals below plus what the review added, the decisions to raise, and ready `task.json` / `analyze.json` / `validate.json`. **Open a task from its plan doc, through the main gate in `README.md`.** |
| **Arch** | `supabase` \| `frontend` \| `backend`. In Lite, `backend` = `frontend-thinkboard-lite/src/server/**`. |
| **Main-goal** | One sentence. The capability a reviewer can see working. |
| **Mini-goals** | The implementable units. Each becomes a `task.json.goals[]` entry. |
| **Gate** | Must be green before the task closes and before dependents start. |
| **Blocks** | What cannot start until this is done. |

Every task also obeys the standing process: `analyze.json` before code, `validate.json` covering every
goal id, and no git write without explicit confirmation (`09-agent-limitation.md` §1–§2).

---

## 1. Phase map

```
PHASE A  Architecture          000                    no product code
PHASE B  Data contract         001 002 003            Supabase — unblocks everything
PHASE C  Frontend foundation   004 005 006 007        scaffold, kernels
PHASE D  Frontend features     008 … 016              the product, on real data
PHASE E  Backend               017 … 021              4 endpoints + the model
PHASE F  Hardening             022 023 (024)          pilot-ready
```

**Why B before C, when the brief says frontend first.** The schema *is* the frontend's data contract. Three
days of Supabase work removes every mock, every fake API layer, and every later refactor when the real
shapes arrive. Phases C–D are then pure frontend for roughly three quarters of the project. Backend is
genuinely last: four endpoints, and nothing in phases C–D waits on them.

**The demoable slice:** 000 → 001 → 004 → 006 → 008 → 009 → 010 → 012. At that point a user opens a
workspace, highlights a PDF, writes a note with a stylus, and it persists and syncs — with zero backend and
zero model calls.

---

## PHASE A — Architecture

### `000-task-architecture-contract` · `frontend`

**Main-goal —** Produce the machine-readable contract an agent generates from, so no file is ever created
by inference.

**Mini-goals**
- `g1` Write `architecture.blueprint.json`: domain tables from `02-database-architecture.md`, contexts, the 4 commands, canvas leaves, listeners, `localFirst` block.
- `g2` Write `AGENTS.md` — dependency direction, the leaf convention, the 4-point store edit, the "ask, don't invent" rule.
- `g3` Extend `scripts/verify-architecture.mjs` with I11–I29 from `04-frontend-folder-architecture.md` §12 and the v2 additions.
- `g4` Write ESLint rules: `shared/` may not import features; painters may not import store or features; `components/canvas/**` may not import `motion`.
- `g5` Record `openQuestions[]` in the blueprint for every unanswered D-/Q- item across the plan docs.

**Gate** — replaced by `todo-task-000-split.md` §2 (18 goals, five packages): `node scripts/verify-architecture.mjs --fixtures`
catches every planted violation under its own id and prints all 29 rows. "Green on an empty tree" was satisfiable by a stub (D1).
**Blocks** — everything.

---

## PHASE B — Data contract (Supabase)

### `001-task-supabase-lite-migration` · `supabase`

**Main-goal —** The Lite schema exists on a fresh project, so the frontend has real tables to build against.

**Mini-goals**
- `g1` Apply `0001`–`0003` clean on a fresh local stack.
- `g2` Author `0004_lite.sql`: three enums, `highlight_notes`, six columns, `can_lead_session()`, `promote_highlight()` RPC, two touch triggers.
- `g3` Add the two broadcast triggers with **per-row topic selection** (`ws:{sessionId}` vs `user:{profileId}`).
- `g4` Add the two `realtime.messages` policies.
- `g5` **Drop and recreate** `"artifact highlights"` and `"highlight conclusions"` — the only non-additive change; note it in `code.json.decisions`.
- `g6` `supabase db reset` runs clean end to end, twice.

**Gate** — reset from scratch with no manual fixes; `0004` is idempotent on re-run.
**Blocks** — 002, 003.

### `002-task-rls-access-proof` · `supabase`

**Main-goal —** Prove the access model in code, because DB-1 makes RLS the authorization layer rather than a safety net.

**Mini-goals**
- `g1` Seed two members and one leader in one workspace.
- `g2` Test: B cannot select A's private highlight → 0 rows.
- `g3` Test: B cannot select the `mini_conclusion` of A's private highlight → 0 rows.
- `g4` Test: B cannot insert `layer='group'`; the leader can.
- `g5` Test: B receives A's *promoted* highlight on `ws:{sessionId}`, and receives A's *private* highlight on **no** topic.
- `g6` Test: `promote_highlight()` flips the highlight and its note together, and refuses someone else's row.

**Gate** — all six green against a real local Supabase. `g3` and `g5` are the two that never surface in manual testing.
**Blocks** — 008.

### `003-task-types-and-seed` · `supabase`

**Main-goal —** The frontend can import generated types and log into a populated workspace.

**Mini-goals**
- `g1` `supabase gen types typescript` → `shared/types/domain/*`, branded ids preserved.
- `g2` Seed: one team, one leader, two members, one board/column/session, one PDF artifact.
- `g3` Seed `llm_providers` / `llm_models` rows for the settings dropdown.
- `g4` Storage bucket + policy for artifact PDFs; upload the seed document. *(As built: migration `0005_storage_artifacts.sql`; the local start script now includes storage-api.)*
- `g5` A `db:seed` npm script that resets to this state in one command.

**Gate** — a fresh checkout reaches a logged-in workspace with a real PDF in under five minutes.
**Blocks** — 008, 009.

---

## PHASE C — Frontend foundation

### `004-task-frontend-scaffold` · `frontend`

**Main-goal —** An empty app that already obeys the folder law, so no later task has to retrofit it.

**Mini-goals**
- `g1` **Conform the existing scaffold** (C9 — `create-next-app` already ran): move it under `src/`, the four path aliases in **both** `tsconfig.json` and `vitest.config.mts`, and spread `eslint.architecture.mjs` into the existing `eslint.config.mjs` *(handoff from 000 g17)*.
- `g2` `src/{app,features,shared}` skeleton; `components.json` bound to the three component tiers.
- `g3` Vitest (jsdom + `fake-indexeddb`) and Storybook + Playwright wired.
- `g4` `verify:arch` = `node scripts/verify-architecture.mjs` *(handoff from 000 g17)*, `lint`, `typecheck`, `test` (Vitest + `node --test "scripts/*.test.mjs"`) as npm scripts, all green.
- `g5` Serwist configured, with a note that it is disabled in dev under Turbopack.

**Gate** — `npm run verify` green **on the real, conformed tree** — moved here from task 000's gate *(000 g18)*.
**Blocks** — 005, 006.

### `005-task-design-system` · `frontend`

**Main-goal —** Atoms, theme and the provider tree exist, so every later component composes rather than invents.

**Mini-goals**
- `g1` `shadcn add` the atom set: button, input, textarea, sheet, dialog, tabs, card, skeleton, sonner, tooltip, switch.
- `g2` `globals.css` theme tokens; highlight colours defined as tokens for light **and** dark.
- `g3` `LibraryProvider` in the fixed order: Redux → PersistGate → Shadcn → Theme → Tooltip, `Toaster` mounted once.
- `g4` `useBreakpoint()` in `shared/hooks` — **the only** source of device branching.
- `g5` `stripUi` persist transform + `persistConfig` + `listenerMiddleware` registered (the 4-point edit).

**Gate** — the app boots light and dark; no hex colour under `shared/components`.
**Blocks** — 008.

### `006-task-entities-kernel` · `frontend`

**Main-goal —** A local database that is the app's only read surface, so every later feature is offline-capable by construction.

**Mini-goals**
- `g1` Dexie schema, **namespaced per profile** (`thinkboard:{profileId}`); delete on sign-out.
- `g2` `repository/` write surface — each write is row + outbox entry in **one** transaction.
- `g3` `queries/` read surface — named live-query hooks; `useLiveQuery` appears nowhere else.
- `g4` `utils/mappers.ts` — `toWire` / `toRow`; local-only fields never cross.
- `g5` `apply-remote.ts` — writes without an outbox entry.
- `g6` Repository tests under `fake-indexeddb` asserting row-and-outbox atomicity, and a mapper test asserting the key set against the column list.

**Gate** — tests green; `dexie` imported only in these three modules (I29).
**Blocks** — 007, 008.

### `007-task-sync-kernel` · `frontend`

**Main-goal —** Local writes reach Supabase and remote changes reach Dexie, so the app is correct online and offline before any feature depends on it.

**Mini-goals**
- `g1` `outbox/push.ts` — drain in strict `seq` order, `upsert` on `id`, delete the op only on confirmation.
- `g2` `outbox/coalesce.ts` — at most one pending update per row; `backoff.ts` — 5xx/network retry, 4xx park as `failed`.
- `g3` `realtime/channel.ts` — `setAuth()` **before** subscribe and on every refresh; subscribe to both topics.
- `g4` `reconcile/manifest-diff.ts` — push → pull → resubscribe; detect deletes.
- `g5` `sync-slice` + status selectors; listener registered in `store.ts`.
- `g6` Tests: seq order, coalescing, 4xx parking, reconnect order, delete detection.

**Gate** — two browsers on the seed workspace: a row written in one appears in the other; kill the network, write three rows, restore, all three land once.
**Blocks** — 015, 016.

---

## PHASE D — Frontend features

### `008-task-auth-and-workspace-shell` · `frontend`

**Main-goal —** A user signs in and opens a workspace with a leader, a persona and a goal.

**Mini-goals**
- `g1` Supabase auth: sign in / out; session cached locally so **offline open needs no token refresh**.
- `g2` Workspace create: team + board + column + session in one transaction; **the creator picks the leader**.
- `g3` Members list; leadership transfer.
- `g4` Workspace persona (leader) and personal persona (self) editors.
- `g5` `WorkspaceShell` — the one screen: document area, right rail, header with sync pill, mode switch, theme switch.
- `g6` Route is a client component loaded `ssr: false`; no SSR data dependency.

**Gate** — sign in → create a workspace → land on the shell, against real RLS.
**Blocks** — 009.

### `009-task-pdf-canvas` · `frontend`

**Main-goal —** The workspace PDF renders, pans and zooms smoothly on a tablet.

**Mini-goals**
- `g1` `shared/lib/pdf.ts` seam; download from Storage once, cache bytes in **OPFS**; `navigator.storage.persist()`.
- `g2` Page windowing: render ±1 page, unmount Konva Stages outside the window.
- `g3` `page-stage` canvas leaf — z0 PDF canvas, z1 text layer, z2 Konva Stage, z3 DOM overlay.
- `g4` Viewport slice: zoom, page cursor, rotation; pinch-zoom and two-finger pan via Pointer Events.
- `g5` `shared/utils/geometry.ts` — normalize / denormalize page-relative rects, with tests.

**Gate** — a 30-page PDF scrolls at 60 fps on the pilot tablet; memory flat while scrolling.
**Blocks** — 010, 011.

### `010-task-text-highlight` · `frontend`

**Main-goal —** Selecting text on the PDF creates a persisted, exact-text focus point.

**Mini-goals**
- `g1` Selection/Range capture over the PDF.js text layer → client rects → normalized rects.
- `g2` Slug generation `h-pNN-NN-xxxxxx`, deterministic from text + quantized rect.
- `g3` `repository.createHighlight()` with `extraction='text_layer'`, `confidence=1.0`, `layer='individual'`.
- `g4` `highlight-layer` canvas leaf draws stored highlights from the live query.
- `g5` Zoom-then-reload test: marks land in the same place.

**Gate** — highlight, zoom, rotate, reload, still correct. This is the hardest problem in the project.
**Blocks** — 012, 013.

### `011-task-region-highlight-and-ocr` · `frontend`

**Main-goal —** Pages with no text layer can still be marked, with confidence-gated OCR text.

**Mini-goals**
- `g1` `marquee` + freehand ink leaves with a `*.painter.ts` — refs, rAF, `batchDraw`; the **only** imperative Konva file.
- `g2` Stylus handling: Pointer Events, `pointerType==='pen'` palm rejection, `touch-action:none` **only** while a draw tool is active.
- `g3` `shared/lib/ocr.ts` — Tesseract in a Worker, lazy, on the **cropped rect only**.
- `g4` Confidence gate at 0.70: below it the highlight is `needs-correction` and is excluded from any Result until a human accepts it.
- `g5` Storybook stories including `ManyStrokes` (≥200 points) and `DarkTheme`.

**Gate** — a scanned page yields a usable highlight; ink stays at 60 fps with 200 points.
**Blocks** — 021.

### `012-task-notes-and-handwriting` · `frontend`

**Main-goal —** A focus point can carry a note, typed or handwritten, and handwriting produces **text** with no model and no network.

**Mini-goals**
- `g1` `note-editor` with two tabs — *Ketik* and *Tulis tangan* — both writing to the same `content` field.
- `g2` The handwriting tab is a **plain `<textarea>`** styled as ruled paper: ≥20px, line-height ≈2.4, `spellCheck={false}`, ~16px clear padding, no `contenteditable`, no rich-text library.
- `g3` **Layout constraint:** the note sheet gets its own stacking context and an opaque background; the Konva Stage beneath is `pointer-events:none` while it is open, or the OS never sees the pen gesture.
- `g4` `writing-check` — a one-time practice box per device; result stored in `meta.handwriting` (`os` / `unavailable`); per-platform enable instructions.
- `g5` Autosave debounced 800 ms, coalesced into one outbox op; `input_mode` records which tab was used.
- `g6` **Run the device test** from `05-frontend-sync-handwriting.md` §3.4 on the pilot's real tablets, in Indonesian, and record the result in `validate.json`.

**Gate** — three users write real Indonesian notes with a stylus on their own tablets and the text is usable. `g6` decides whether task 024 exists at all.
**Blocks** — 013, 024.

### `013-task-sheets-and-promotion` · `frontend`

**Main-goal —** The three sheets work, and a member can put their own thinking forward to the group.

**Mini-goals**
- `g1` `individual_notes` sheet — my highlights and notes for the current page, with a *Share to group* control.
- `g2` `group_notes` sheet — group-layer highlights, promoted member notes, the leader's notulen (`memory_entries scope='group'`).
- `g3` `result` sheet shell with Individual / Group tabs.
- `g4` `promote_highlight()` wired; optimistic through the repository; leader-only affordances hidden for members.
- `g5` One sheet at a time below 1280px; docked right rail above it.

**Gate** — as a member: private note invisible to a teammate; promote; now visible. Matches task 002's tests from the UI.
**Blocks** — 014.

### `014-task-result-ui-against-stub` · `frontend`

**Main-goal —** The result experience is complete and reviewable before any model call exists.

**Mini-goals**
- `g1` Command hooks for `mini-conclusion` and `generate-result`, pointed at a **stubbed** route that writes canned rows.
- `g2` Result reads come from **Dexie**, never from the mutation response; the mutation returns an id or a status only.
- `g3` Descriptive markdown rendering; `mermaid-figure` template for visualize mode.
- `g4` Temperature chips with the rule-based formula and a one-line tooltip explaining the score.
- `g5` States: empty, running, queued (quota), failed, done.

**Gate** — the full result flow is demoable with the server stubbed. Proves phases C–D do not depend on E.
**Blocks** — 020.

### `015-task-realtime-presence` · `frontend`

**Main-goal —** A workspace feels shared: you see who is there and marks appear as they are made.

**Mini-goals**
- `g1` Presence: who is here, which page.
- `g2` `peer-cursors` canvas leaf — **refs and imperative paint only**, never React state; throttled ~20 Hz, sent only on real movement.
- `g3` Broadcast-from-database events applied via `applyRemote`; same render path as a local write.
- `g4` "Leader is drawing" ephemeral indicator.
- `g5` Two-browser test: latency budget ~100–300 ms; a private highlight arrives on **no** shared topic.

**Gate** — five simulated peers at 20 Hz with no dropped frames on the pilot tablet.
**Blocks** — 023.

### `016-task-offline-and-export` · `frontend`

**Main-goal —** The private sheet works with the network off, and a workspace can leave as a portable bundle.

**Mini-goals**
- `g1` Mode switch — manual *Work offline* is authoritative; auto-detect may only degrade, never silently resync.
- `g2` Offline UI: group sheet read-only with `lastSyncedAt`; disabled affordances labelled, not hidden.
- `g3` "Back online · N changes to sync" with an explicit button.
- `g4` Export bundle: `document.pdf` with `/Highlight` annotations appended (`/NM` = slug), `notes.md` with `<!-- tb … -->` anchors, `thinkboard.json`, zipped with `fflate`.
- `g5` Re-import: the HTML comment is the only identity anchor; an anchorless section imports as a new unanchored note; orphans are reported, never guessed.
- `g6` *Clear local data on sign out*; the group document is not cached offline by default.

**Gate** — airplane mode: open, highlight, note, export. Reconnect: everything lands once. Export → edit prose → re-import → no duplicates.
**Blocks** — 023.

---

## PHASE E — Backend

### `017-task-command-endpoints` · `backend`

**Main-goal —** The four server endpoints exist with real auth and no business logic in the route layer.

**Mini-goals**
- `g1` `POST /api/v1/workspaces`, `POST /api/v1/highlights/:id/mini-conclusion`, `POST /api/v1/workspaces/:id/results`, `GET /api/v1/runs/:id/stream`.
- `g2` Handlers bind, call one service method, map the error. No `if` on domain state.
- `g3` `src/server/` mirrors the future Go package names: `pipeline/`, `pipeline/stages/registry.ts`, `llm/`, `memory/`, `db/`.
- `g4` Every request runs under the **user's JWT**. No service-role key anywhere.
- `g5` Group-result requests return 403 unless `can_lead_session()`.

**Gate** — every endpoint traces to a `blueprint.commands[]` entry; there is no fifth.
**Blocks** — 018.

### `018-task-llm-adapter` · `backend`

**Main-goal —** One model interface with provider rotation and honest accounting, so quota is a config problem rather than a code problem. *(Decision: §3 below.)*

**Mini-goals**
- `g1` `llm/service.ts` — `complete()` / `stream()`, taking a `profileId`, **never a key**.
- `g2` `llm/providers/*` — OpenAI-compatible adapters; provider list and order from config, not imports.
- `g3` `llm/resolver.ts` — own key first (Vault, resolved in `vault.ts` and nowhere else), else shared pool; default from `profile_identities.kind`.
- `g4` `llm/ratelimit.ts` — on 429 fail over to the next provider; when all are exhausted, queue the run as `pipeline_runs.status='pending'` and report *when*, not just an error.
- `g5` `llm/usage.ts` — one `llm_requests` row per call, batched off the hot path.
- `g6` Mini-conclusion cache key `(highlight.text, notes_hash, persona_id)` — nothing re-runs unless an input changed.

**Gate** — the whole provider set can be swapped by editing config. A forced 429 fails over without a user-visible error.
**Blocks** — 019, 020.

### `019-task-mini-conclusion` · `backend`

**Main-goal —** Each focus point gets a cheap conclusion that respects the free-tier budget.

**Mini-goals**
- `g1` Debounce 3 s after a highlight or note change; idempotent per cache key.
- `g2` Prompt: goal → persona → highlight text → attached notes → output contract.
- `g3` Write `mini_conclusions`; the client picks it up through the broadcast, like any other row.
- `g4` Skip entirely for `needs-correction` highlights below the OCR confidence gate.
- `g5` Budget check: a 40-highlight workspace costs ≈42 calls, not 40 × 7.

**Gate** — 40 highlights processed inside one day's free-tier quota, measured from `llm_requests`.
**Blocks** — 020.

### `020-task-result-engine` · `backend`

**Main-goal —** Individual and group results are produced, scored and rendered from real data.

**Mini-goals**
- `g1` Three stages via the registry: `scope_anchor` → `analytic` → `result`; one file, one registry entry, one transition test each.
- `g2` Individual run: own notes + own persona + goal. Group run: group notes + promoted notes + leader notulen + workspace persona.
- `g3` `owner_profile_id` set or null; all mini-conclusions batched into **one** prompt.
- `g4` Rule-based temperature (backers, corroborating authors, limitation notes, text-layer vs OCR).
- `g5` `run_renderings`: `descriptive` markdown and `visualize` mermaid.
- `g6` SSE stream over a **detached** context so a dropped socket does not kill the run.

**Gate** — swap task 014's stub for the real engine with **no frontend change**. That is the proof the seam was right.
**Blocks** — 023.

### `021-task-leader-import` · `frontend` *(secondary: `backend`)*

**Main-goal —** A leader drops in an already-highlighted PDF and every mark becomes a group focus point with a note and a slug.

**Mini-goals**
- `g1` **Rung 1 first:** `page.getAnnotations()` → `subtype==='Highlight'` → QuadPoints → `convertToViewportRectangle()`; multi-line quads flatten into one highlight with several rects.
- `g2` Rung 2: flattened highlights — HSV colour mask, connected components, intersect with text-layer items for exact text.
- `g3` Rung 3: scans — same mask, crop, Tesseract, confidence gate.
- `g4` **Review screen before commit** — checkboxes and editable OCR text; a colour mask fires on charts and coloured table headers.
- `g5` Each accepted region → `layer='group'` highlight + empty note + slug, in one batch.

**Gate** — an Acrobat-annotated PDF imports with exact text and zero OCR calls.
**Blocks** — —

---

## PHASE F — Hardening

### `022-task-responsive-motion-theme` · `frontend`

**Main-goal —** The product is right on the device 70% of users actually hold.

**Mini-goals**
- `g1` Device matrix implemented: tablet authors, desktop analyses, mobile reads and writes notes; no freehand ink on mobile.
- `g2` Sheets: full-screen on mobile, right sheet on tablet, docked rail ≥1280.
- `g3` `motion` pass on DOM only; `prefers-reduced-motion` honoured everywhere; no `motion` import under `components/canvas/`.
- `g4` Dark mode: Konva colours passed into the Stage explicitly and redrawn on theme change; highlights keep hue and lose alpha rather than darkening.
- `g5` Tablet pass on real hardware: tap targets, pen vs finger, keyboard-open layout.

**Gate** — a full session completed on the pilot tablet without reaching for a mouse.

### `023-task-pilot-hardening` · `backend` *(secondary: `frontend`)*

**Main-goal —** The pilot survives a real week: bad network, exhausted quota, unhappy paths.

**Mini-goals**
- `g1` Queued runs surfaced with position and expected time, not a spinner.
- `g2` Every empty / error / offline / parked-op state designed, not defaulted.
- `g3` Failed outbox ops visible and retryable from the sync pill.
- `g4` Telemetry: Tier-A handwriting adoption (`transcribed_by`), sync failure rate, LLM cost per workspace.
- `g5` Load sanity: one workspace, six members, 200 highlights, eight hours.

**Gate** — a full pilot day with the network deliberately broken three times, and no data loss.

### `024-task-ink-fallback` · `frontend` — **conditional**

**Main-goal —** Members whose tablet cannot convert handwriting can still write by hand.

**Only build this if task 012 `g6` failed.** If OS handwriting works on the pilot's tablets, delete this task.

**Mini-goals**
- `g1` `ink-pad` canvas leaf behind a *draw instead* control; opened deliberately, never the default.
- `g2` Strokes `{x,y,t,pressure}` → `highlight_notes.ink` as JSON; rendered as SVG, never a raster image.
- `g3` `transcribe` outbox op: try `navigator.createHandwritingRecognizer()`, else one vision-model call on reconnect, else leave as ink and stop asking.
- `g4` `transcribed_by` recorded; ink kept beside the transcript, never destroyed.

**Gate** — an ink note survives offline capture, reconnect and transcription with the strokes intact.

---

## PHASE G — Integration

### `025-task-wire-document-view` · `frontend`

**Main-goal —** The workspace document view is actually mounted, so the highlight, note and result surfaces built through Phase D become visible at `/w/[workspaceId]` instead of living only in unimported components.

**Why it exists** — 009 (`DocumentViewer`), 010 (`HighlightedPage`), 011 (`RegionHighlightCapture`), 012 (`NoteSheet`), 015 (`PeerCursors`) and 021 (`ImportReview`) all shipped components that no route mounts yet; the workspace shell still renders a placeholder `<main>`. This task closes that gap. It is an *integration* task, not a feature: it adds no new domain behaviour.

**Mini-goals**
- `g1` `WorkspaceShell` renders a document view in its main area instead of the placeholder; the view is injected by the app route, because `features/workspace` may not import `document`/`highlight` (I3).
- `g2` `DocumentViewer` composes `HighlightedPage` through its `renderPage` slot at the app level; the app-level component runs no store selector or dispatch (I4: routes compose, never orchestrate).
- `g3` a region-tool control (off / rectangle / freehand) arms the marquee leaf.
- `g4` a composition test proves the wiring without a live stack.

**Gate** — with a seeded workspace, `/w/<sessionId>` shows the PDF; selecting text persists a highlight; a region tool persists one.
**Blocks** — —; it makes 009-012/015/021 user-visible.

### `026-task-workspace-context` · `frontend`

**Main-goal —** A shared workspace context supplies `profileId`/`sessionId` to any feature, so the note, presence and import surfaces can mount without a feature→feature import (I3) or a store hook under `src/app` (I4). Its first consumer is 012's note sheet.

**Why it exists** — raising the layering question in `task-review-2026-09-25.md` showed no allowed component can hand `profileId` to `features/notes`/`features/presence`; this is the seam all three remaining mounts need.

**Mini-goals**
- `g1` a shared `WorkspaceProvider`/`useWorkspaceContext` in `shared/providers`, provided by the workspace shell.
- `g2` a session-wide highlights read in `entities/queries` (`use-highlights-for-session`).
- `g3` a `note-panel` container in `features/notes` that lists the session's highlights and opens the note sheet for the selected one, reading `profileId` from the context.
- `g4` the app-level document composition renders the note panel beside the document.

**Gate** — with a seeded workspace, `/w/<id>` lists the highlights and opening one lets the author write a note.
**Blocks** — —; it unblocks mounting 012's sheet, 015's cursors and 021's import review.

### `027-task-export-bundle` · `frontend`

**Main-goal —** A member can export the open workspace from the shell: one zip with the original PDF plus `/Highlight` annotations, `notes.md` with anchors, and `thinkboard.json`.

**Why it exists** — 016 built the full bundle seam (`shared/lib/bundle.ts`) and closed, but no control ever called it; the app now has the document view (025), a shared workspace context and a session-wide read (026), so the export UI can finally be mounted.

**Mini-goals**
- `g1` a session-wide notes read (`use-notes-for-session`) beside 026's highlights read.
- `g2` `use-export-workspace` maps the session's rows and the main PDF bytes into `BundleInput`, appends annotations, zips, and downloads `workspace-{slug}-{yyyymmdd}.zip`.
- `g3` a `downloadBytes` helper (`shared/lib/download.ts`) with the bytes -> blob -> anchor step unit-tested.
- `g4` an Export control in the shell header.

**Gate** — with a seeded workspace, Export downloads a zip holding `document.pdf` (annotated), `notes.md` (anchored) and `thinkboard.json`.
**Blocks** — —; it completes 016's follow-up.

### `028-task-presence-rail` · `frontend`

**Main-goal —** The workspace shows who is here and raises the "Leader is drawing" indicator, so 015's presence state is finally user-visible.

**Why it exists** — 015 shipped the presence hook and channel but mounted nothing; 026's shared context now supplies the ids it needs.

**Mini-goals**
- `g1` `usePresence` skips opening the live channel when no session/profile is in context.
- `g2` a `presence-rail` container in `features/presence` showing the peer count and the leader indicator, reading `profileId`/`sessionId` from the shared context and the leader from the members meta.
- `g3` the app document composition renders the rail.
- `g4` tests for the rail hook and component.

**Gate** — two browsers in one workspace see each other in the rail and the "Leader is drawing" badge appears while the leader's pen moves. (Live; the peer-cursor canvas painting is a separate follow-up.)

### `029-task-reimport-review` · `frontend`

**Main-goal —** A member can paste an exported `notes.md` and re-import it: the HTML comment's slug matches the note, so editing the prose in a text editor and importing again updates it with no duplicate.

**Why it exists** — 016 built `planReimport` and closed, but no control ever called it; the notes rail (026) is the natural home.

**Mini-goals**
- `g1` a `reimport-review` container in `features/notes` that parses pasted markdown via 016's `planReimport` and shows matched / unanchored / orphan / missing counts.
- `g2` applying the matched updates: a matched slug updates the author's existing note or inserts one, never a duplicate (RULE-25); anchorless sections are not guessed at.
- `g3` mounted in the notes rail.
- `g4` hook + component tests.

**Gate** — export → edit the prose → paste back → apply updates the note and adds none.

### `030-task-db-housekeeping` · `supabase`

**Main-goal —** Close the two database items the review carried: an unauthenticated `anon` role must not be able to call the definer RPCs, and a teammate must be able to read a co-member's profile name.

**Why it exists** — both are recorded housekeeping (task review §3.5, README §6): `anon` inherits EXECUTE on the definer RPCs from PUBLIC, and `profiles`' own-only policy hides the roster's names.

**Mini-goals**
- `g1` `0007_revoke_anon_execute.sql` — revoke EXECUTE on public-schema functions from PUBLIC and `anon`, grant `authenticated`, and set the same default for later functions.
- `g2` `0008_team_profile_names.sql` — a permissive SELECT policy on `profiles` for co-members.
- `g3` `rls.sql` gains the proof: anon denied, authenticated allowed; a teammate reads a co-member, an outsider does not.
- `g4` the housekeeping items are marked done in the docs.

**Gate —** the live RLS suite passes with the two new checks.

### `031-task-peer-cursors` · `frontend`

**Main-goal —** A teammate's pointer is drawn on the page as it moves, ref-driven at ~20 Hz, and this client publishes its own pointer the same way.

**Why it exists** — 015 shipped the `peer-cursors` leaf and the throttle but nothing painted or published; 028 mounted the presence rail only.

**Mini-goals**
- `g1` one `PresenceProvider` in `features/presence` owns the single live channel and exposes peers, the leader flag and a cursor store (rail and layer both consume it — never two channels).
- `g2` `PresenceLayer` paints incoming cursors through the `peer-cursors` leaf's ref/painter (never React state), denormalized with the page's displayed size/rotation.
- `g3` the page publishes its own pointer, throttled ~20 Hz and only on real movement.
- `g4` tests: provider wiring, layer painting, publish normalisation + throttle.

**Gate —** two browsers in one workspace: each sees the other's pointer move; latency ~100-300 ms on the live stack.

### `032-task-import-existing` · `frontend`

**Main-goal —** A leader can import the highlights already embedded in the open workspace PDF as group focus points, review-gated.

**Why it exists** — 021 built the three-rung ladder and closed, but nothing mounted it. This mounts **rung 1** against the *open* document (its own `/Highlight` annotations + text layer), which needs no upload flow.

**Scope note** — D-02's default (the import is a *separately uploaded* note-slot copy) needs an artifact-upload flow Lite does not build; that stays open. This task imports the open document's own annotations, which is geometry-correct and review-gated.

**Mini-goals**
- `g1` `ImportCandidate` carries its page; `ImportReview`/`useImportReview` write per-candidate (slug, bbox, reading order).
- `g2` a `pdf-text-boxes` helper maps pdfjs text items to display-space boxes for the exact-text intersect.
- `g3` an `import-source` container scans the session's main PDF (rung 1) and offers `ImportReview`; mounted in the document view.
- `g4` tests for the box mapping, the scan, and the per-page review.

**Gate —** with a seeded workspace whose PDF carries `/Highlight` annotations, the leader scans, reviews and imports them as group highlights.

---

## 2. Dependency graph

```
000 ─▶ 001 ─▶ 002 ─┐
        │          ├─▶ 008 ─▶ 009 ─▶ 010 ─▶ 012 ─▶ 013 ─▶ 014 ─▶ 020 ─▶ 023
        └─▶ 003 ───┘                  │        │                    ▲
                                      └─▶ 011 ─┴─▶ 021              │
000 ─▶ 004 ─▶ 005 ──────────────────▶ 008                           │
        └──▶ 006 ─▶ 007 ─▶ 015 ─────────────────────────────────────┤
                       └──▶ 016 ─────────────────────────────────────┤
                            017 ─▶ 018 ─▶ 019 ─▶ 020                 │
                                                  022 ───────────────┘
                            012 g6 fails ─▶ 024
```

**Critical path:** 000 → 001 → 004 → 006 → 008 → 009 → 010 → 012. Everything else can run beside it.

---

## 3. Decision — LLM routing (attached to task 018)

**OmniRoute is a good tool aimed at a different problem.** It is a self-hosted gateway for *coding agents*:
it runs at `localhost:20128` with an Electron desktop app and a React dashboard, and routes IDE tools —
Claude Code, Cursor, Cline, Copilot — through a subscription → API-key → cheap → free fallback chain.

Three reasons it does not belong inside ThinkBoard:

1. **Wrong shape.** It is a localhost proxy for one developer's machine. ThinkBoard needs a server-side
   adapter inside a Next.js route handler, serving many users, routing per `profile_identities.kind`, and
   writing an `llm_requests` row per call. A generic gateway knows nothing about profiles, Vault secrets,
   or queueing a run as `pipeline_runs.status='pending'`.
2. **Compliance.** Its provider list includes "web cookie" providers that ride a user's browser session,
   and its own free-tier documentation notes that some providers explicitly prohibit programmatic or
   third-party-harness use. For a state-owned enterprise that is a real exposure, and it is the same
   question already flagged as D-12.
3. **Operational weight** — your own observation. An Electron app and a dashboard is a service to run,
   monitor and secure, for a product whose premise is a free Supabase tier and a pilot team.

**Recommendation: keep the adapter you already specified, and make OpenRouter provider #1.**

| Layer | Choice | Why |
|---|---|---|
| Interface | `src/server/llm/service.ts` — `complete()` / `stream()`, takes a `profileId` | already in the architecture; one seam, swappable |
| Provider #1 | **OpenRouter** — one hosted endpoint, one key, OpenAI-compatible, many free models, its own model-fallback array | replaces a gateway you would otherwise run yourself, with zero infrastructure |
| Provider #2 | **Groq** — separate quota pool, different failure mode | rotation only helps if the pools are independent |
| Provider #3 | the user's own key via Vault, when present | `key_source='user'` |
| Failover | ~40 lines in `ratelimit.ts` | it must know about `llm_requests` and queued runs, which no generic router does |

Everything is OpenAI-compatible, so an adapter is a `fetch` and a response mapper. Optionally use the
Vercel AI SDK's provider registry for streaming ergonomics — it is TypeScript-native and fits a route
handler — but it is a convenience, not a requirement.

**Where OmniRoute *is* worth using: the development loop.** Point Claude Code or Cursor at it while
building ThinkBoard. That is exactly what it was made for. Just keep it out of the product.

**Still unanswered, and it gates task 018:** most no-card free tiers fund themselves with your prompts.
Answer D-12 before picking providers.

---

## 4. Estimates and staffing

Rough, for sequencing rather than commitment. One developer plus an agent.

| Phase | Tasks | Relative effort | Note |
|---|---|---|---|
| A Architecture | 000 | 3% | pays for itself by task 010 |
| B Data contract | 001–003 | 10% | small, and it unblocks everything |
| C Foundation | 004–007 | 22% | 006 and 007 are the real work |
| D Features | 008–016 | 42% | 010 and 012 carry the most risk |
| E Backend | 017–021 | 18% | four endpoints |
| F Hardening | 022–024 | 5% | 024 may not exist |

**The two tasks most likely to overrun:** 010 (highlight coordinates across zoom, rotation and re-render)
and 007 (sync). Budget spikes for both, in that order.

---

## 5. Standing rules for every task

1. `analyze.json` before any code; `plan_refs` cite doc **and** section.
2. `validate.json.goal_checks` has one entry per mini-goal id. No exceptions.
3. Anything touching pipeline-stage transitions or RLS cannot reach `validate` with `test.json.summary.total: 0`.
4. Every mini-goal that overlaps an open decision (D-, Q-, DB-Q-) is raised in `analyze.json.open_questions`, never silently resolved.
5. **No git write without explicit confirmation, every time** — `09-agent-limitation.md` §1. Work lands on the shadow branch, never on `master`.
6. `npm run verify` green before a task closes.
