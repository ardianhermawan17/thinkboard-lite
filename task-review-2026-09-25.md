# ThinkBoard Lite — full task review · 2026-09-25

A review of all 25 tasks (`06-whole-apps-task.md`) against `agent-history/running-process.json`,
`agent-thinking/tracking-todo.json` and each task's `result.json`. **Read with the main gate** (`README.md`).

> Snapshot: **15 done · 3 blocked · 1 conditional · 6 not started.** A production build is green
> (`npm run verify`: architecture 18/0, 321 tests passed / 10 skipped; `next build` succeeds). **Nothing is
> unblocked by dependency any more** — the remaining work is waiting on humans, hardware, or other blocked tasks.

---

## 1. Status at a glance

| Phase | Task | Arch | Status | Evidence / blocker |
|---|---|---|---|---|
| A | 000 architecture contract | frontend | **done** | blueprint + verify-architecture + eslint architecture + AGENTS.md |
| B | 001 Supabase Lite migration | supabase | **done** | `0001`–`0005`, seeded stack, storage bucket |
| B | 002 RLS access proof | supabase | **done** | 56 checks, each policy mutation-tested |
| B | 003 types and seed | supabase | **done** | generated types, seed, placeholder provider rows (D-12 open) |
| C | 004 conform the scaffold | frontend | **done** | `verify:arch` 18/0, Vitest + Storybook |
| C | 005 design system | frontend | **done** | atoms, tokens, store seam, providers |
| C | 006 entities kernel | frontend | **done** | Dexie mirror + repositories + live queries |
| C | 007 sync kernel | frontend | **done** | outbox push, realtime pull, reconcile, sync slice |
| D | 008 auth + workspace shell | frontend | **done** | sign-in, create workspace RPC, shell |
| D | 009 PDF canvas | frontend | **done** | OPFS, ±1 windowing, page-stage, viewport; on-device gate deferred (Q8) |
| D | 010 text highlight | frontend | **done** | selection capture, slug, highlight-layer; route wiring deferred |
| D | 011 region highlight + OCR | frontend | **done** | marquee leaf + painter, cropped Tesseract, 0.70 gate; on-device gate deferred (Q8/Q9) |
| D | 012 notes + handwriting | frontend | **blocked** (3/7) | Q7/Q8/Q9 + C6 + g7's Playwright shape |
| D | 013 sheets + promotion | frontend | not started | needs 012 |
| D | 014 result UI against a stub | frontend | not started | needs 013 |
| D | 015 realtime presence | frontend | **blocked** (5/6) | code + `0006_live_topic.sql` done; g5 two-browser latency needs the live stack |
| D | 016 offline + export | frontend | **done** | manual mode, bundle (pdf-lib/fflate), OPFS wipe; export UI deferred |
| E | 017 command endpoints | backend | **done** | four `/api/v1` routes, user-JWT requestContext, 403 rule |
| E | 018 LLM adapter | backend | **blocked** | **D-12** unanswered |
| E | 019 mini-conclusion | backend | not started | needs 018 |
| E | 020 result engine | backend | not started | needs 014 + 018/019 |
| E | 021 leader import | frontend | **done** | three-rung ladder, review screen, one-transaction commit; route entry point deferred |
| F | 022 responsive, motion, theme | frontend | not started | needs 008–013 |
| F | 023 pilot hardening | backend | not started | needs 015/016/020/022 |
| F | 024 ink fallback | frontend | **conditional** | only if 012 g6 fails |

Counts: **done 15** · **blocked 3** (012, 015, 018) · **conditional 1** (024) · **not started 6** (013, 014, 019, 020, 022, 023).

---

## 2. What is actually finished and verified

- **Data + authorization (Phase B):** the Lite schema and its RLS proof are the strongest part of the repo;
  002 mutation-tested every policy. 003's provider rows are explicit placeholders, not a D-12 answer.
- **Frontend foundation (Phase C):** folder law, design system, Dexie mirror and the sync kernel are real and
  tested; every later feature reads Dexie and writes through the outbox.
- **The highlight→note→result slice (Phase D, most of it):**
  - **009** renders and navigates a PDF (OPFS, windowing, geometry round trip).
  - **010** captures exact text highlights (deterministic slug, zoom-then-reload test).
  - **011** adds region/freehand capture and cropped OCR behind a derived 0.70 gate, with 4 Chrome stories.
  - **012** (note editor, handwriting textarea, I27 composition) is built but **blocked** on human/hardware goals.
  - **016** adds the manual offline switch, the portable bundle (`document.pdf` annotations, `notes.md` anchors,
    `thinkboard.json`), RULE-25 re-import and the OPFS+Dexie sign-out wipe.
  - **021** imports an already-highlighted PDF through three rungs and commits accepted regions atomically.
- **Backend (Phase E):** **017** stands up the four command endpoints under the user's JWT with no secret key and
  no domain logic in the routes.
- **015** ships the presence layer and the members-only `live:` topic; only its live measurement is blocked.

Every one of these closed with all six `agent-history/<NNN-task-…>/` phase files, a `result.json` and a board update.

---

## 3. Cross-cutting findings

### 3.1 The route-wiring gap is now the biggest risk to the product
**Nine tasks have built components that no route mounts** (009 `DocumentViewer`, 010 `HighlightedPage`,
011 `RegionHighlightCapture`, 012 `NoteSheet`, 015 `PeerCursors`/`LeaderDrawing`, 016 bundle UI, 021 `ImportReview`).
The workspace shell still renders a placeholder `<main>` that says *"the document area: 009 mounts the PDF canvas
here"*. **The demoable slice is built but not viewable.** No numbered task owns the wiring, and four `result.json`
files have carried it as a follow-up. Recommendation: **open a dedicated document-view task** (next free `NNN`)
that composes the existing pieces behind `/w/[workspaceId]`, before more feature work.

### 3.2 The project is blocked on humans, not on code
No task is unblocked. The blockers are:
- **D-12** — free-tier training terms vs document sensitivity → blocks 018 (and 019/020/023 downstream).
- **Q7** — the 45-minute Bahasa Indonesia handwriting test → decides 012 g6 and whether 024 exists.
- **Q8 / Q9** — the real tablet mix and styluses → gate the on-device checks of 009, 011, 012, 015.
- **C6** — the three-value `input_mode` sign-off → blocks 012 g5's `stylus_os` branch.
- **D-11 / D-10** — device parity and the offline group document (both defaulted, encoded where they were needed).

### 3.3 Live-stack verification is thin
Unit tests are strong, but several proofs can only run against the local Supabase stack and were deferred:
- ~~0006's RLS (a member cannot insert on `ws:`, can send on `live:`)~~ **proven live** — the Lite stack now starts (ports 563xx, see below); the RLS suite runs **20/20** (g17/g18 from 030, and **g19 from 015**: a member sends on `live:`, cannot forge `ws:`, an outsider is refused) plus seed/storage **6/6**;
- ~~007/008 live paths~~ **proven live** — `sync-engine.live.test.ts` (4/4: realtime private topic, an offline drain lands once) and `workspace-remote.test.ts` (6/6: sign-in, `create_workspace`, transfer leadership through the outbox, persona-write RLS parking) pass against the stack;
- ~~017's 403 path under real RLS~~ **proven live** — `command-endpoints.live.test.ts` (4/4: a member's group run is 403, their individual run and the leader's group run are 202, no bearer is 401, an invalid scope is 400);
- 015 g5's two-browser latency,
- 016's airplane-mode round trip,
- 021/032's **parser against a real document** is now covered (`annotation-quads.real.test.ts`: a pdf-lib-built PDF with a real two-quad /Highlight + text layer, read through real pdfjs — two rects, exact text, no OCR); a genuine Acrobat-exported fixture in a browser remains the manual check.

**Note (environment):** Windows reserves TCP `55262–55361` on this machine, colliding with the documented 553xx Lite ports; the stack was moved to **563xx** (`config.toml`, README §6, database README, the two live-test comments). Restore 553xx on a machine where the range is free.

**Browser pass (2026-09-26, task 033).** With a headless Chrome driven over CDP against the dev server, the previously "manual" frontend items are now real results:
- **Presence (015/028):** two isolated browser contexts, two teammates; each shows the other ("N here").
- **Peer cursors (031/g5):** a cursor dispatched in one context reached the teammate's Konva canvas in **~70 ms** (well inside 015's ~100–300 ms target).
- **Text highlight + note (010/012/026/007):** selecting text on `example_notes.pdf` wrote a `highlights` row and a note on it wrote a `highlight_notes` row, both synced to Postgres.

The pass **found and fixed two defects that the unit suite structurally cannot see** (jsdom neither cancels a pdfjs render nor performs CSS selection):
1. **The stage never mounted.** The pdfjs render task was never cancelled, so React's dev double-effect (and any page/zoom change) started a second render on the same canvas, which pdfjs refuses. `pageSize` stayed 0, so the Konva stage — peer cursors, the highlight layer, the marquee — never rendered. `renderPage`/`renderTextLayer` now take an `AbortSignal` and cancel the in-flight task.
2. **Text could not be selected.** The page stage's `select-none` is inherited, so pdfjs's text layer was unselectable and 010's entire input was impossible. The text layer is now `select-text` unless a draw tool is armed.

**Follow-ups, now closed (task 034).**
- **The leader indicator fires.** The page stage's current page is mirrored into the shared workspace context (the 026 seam) and presence reads it there; proven live — the teammate's rail raises "Leader is drawing" and clears it via the idle fallback.
- **The offline resume works.** "Sync now" dispatches `manualOfflineSet(false)`, which sets `sync.phase` directly, but the sync listener only reacted to `sync/phaseChanged` — so the reconnect cycle never ran and queued ops stuck at `attempts: 0`. The predicate now watches the phase value; proven live: an offline write stayed local (server unchanged), a reconnect did **not** auto-sync (016 g1), and `Sync now` pushed it (server 5 → 6).
- **Import rungs 2 and 3 are mounted.** An annotation-free page rasterizes and its flattened mark is found by colour, with the text layer supplying the exact text (rung 2, proven with a generated fixture: group highlight "A flattened highlight line", 1.0). A page with no text layer is a scan, and its crops go to OCR (rung 3, proven with an image-only fixture: candidate "Scanned highlight line", imported at 0.94; Import stayed disabled until accept). The pale green mark was correctly ignored (below the mask's 0.35 saturation cut).
- **Still open:** a genuine Acrobat-exported annotated PDF (rung 1 on a real file), and the mask's saturation cut as a tuning question.

**Page navigation (2026-09-26, task 035).** A live-pass grep for `pageChanged`/`rotated` found them defined and tested but **never dispatched**, so a multi-page document was stuck on `pageWindow(1)` = pages 1–2. Added a `Page N of M` control with Prev/Next and a quarter-turn Rotate. The Rotate control exposed a second gap: `renderPage`/`renderTextLayer` built the pdfjs viewport with `{ scale }` only, so the page would not have turned (only the rotation-normalized overlays). Both fixed; proven live on a 4-page fixture — the mounted window slid `[1,2] → [1,2,3] → [2,3,4]` and Rotate changed the rendered canvas `612×792 → 792×612`.

### 3.4 Plan docs have drifted in places
- **015's `0005_live_topic.sql`** collided with the shipped `0005_storage_artifacts.sql`; resolved to `0006`.
- **012 g7** asks for a "named Playwright story test" while the repo has one Storybook story and no `play()`
  precedent — a real form mismatch, not a missing capability.
- **011's "marquee + freehand ink *leaves*"** vs one `marquee` leaf in the blueprint; both tools live in the leaf.
- `02-database-architecture.md` §10 DB-Q9 and 015 g6 now agree only because the migration was renamed.

### 3.5 Housekeeping still outstanding
- ~~Revoke `anon` EXECUTE on the definer RPCs (`0003_grant_schema.sql` still uses `anon`/`service_role` names).~~ **Done and proven live** — task 030 (`0007_revoke_anon_execute.sql`); RLS suite 19/19.
- ~~Let teammates read their team's profile names.~~ **Done and proven live** — task 030 (`0008_team_profile_names.sql`); RLS suite 19/19.
- `003`'s provider rows are placeholders; keep them out of any "provider is configured" assumption.
- The Obsidian vault (`thinkboard-lite-architecture/`) and the `graphify-out/` trees are untracked; decide whether
  they should be versioned.

---

## 4. Per-phase recommendations

| Area | Recommendation |
|---|---|
| D (frontend features) | Open the **document-view wiring task** first; it unblocks 011/012/015/021's value and makes the demo real. Then, if Q7 is answered, finish 012; if not, 013/014 stay gated. |
| E (backend) | Answer **D-12** to unblock 018→019→020; until then, 017's seams (llm/pipeline/memory) are the only backend that can progress. |
| F (hardening) | 022 needs 008–013; 023 needs 015+016+020+022. Neither is reachable yet. 024 is **conditional on 012 g6**; do not start it. |
| Process | Keep the branch-per-task + phase-file discipline that produced this clean audit trail; it made this review possible without reading code. |
| Verification | Add a documented "live stack" run (start stack → seed → run `*.live.test.ts` + the RLS suites) so 0006/017/016/015 can be closed out. |

---

## 5. Bottom line

The **implementation core is healthy**: 15 tasks done, a green `verify`/build, and no unhandled dependency is
missing from the plan. What is left is (a) **one integration task** (mount the built slice) and (b) **human
decisions/hardware** (D-12, Q7, Q8/Q9, C6). Closing those four items converts most of the remaining backlog from
blocked to actionable; nothing in the codebase is currently the bottleneck.

Sources: `agent-history/running-process.json`, `agent-thinking/tracking-todo.json`,
`agent-history/<NNN-task-*/result.json`, `README.md` §5–§6, `06-whole-apps-task.md`.

---

## Postscript (same day, after this review)

The top finding above — the route-wiring gap — was fixed immediately: **task 025** was opened as a new
**PHASE G — Integration** and closed the same day. `/w/[workspaceId]` now mounts `DocumentViewer` +
`HighlightedPage` at the app route (I3/I4 respected) with a region-tool control, so the built slice is visible.

Effect on this review's snapshot: the backlog is now **33 tasks**; **23 done** (000–011, 016, 017, 021, 025–032),
3 blocked (012, 015, 018), 1 conditional (024), 6 not started (013, 014, 019, 020, 022, 023). Every task an agent can
start without a human decision has been opened and closed; the rest are gated on Q7/Q8/Q9, D-12, C6, the live
stack, or D-02's upload flow. Nothing else in
the review changes — the remaining blockers are still human/hardware decisions, and the per-phase
recommendations stand.

**026** implemented resolution 1 below (a shared workspace context) and mounted the note panel on it, so the
remaining mounts (015's cursors, 021's import review, 016's export) now have the seam they needed.

### The next integration step hits a real layering question (raised, not guessed)

Mounting **012's note sheet** (the most user-visible next surface) needs a `profileId` for the note editor.
Today no allowed component can supply it:

- `NoteSheet`/`NoteEditor` live in `features/notes`; 012's `NoteSheet` takes `profileId` as a prop.
- **I3** lets a feature import only `@feature/entities` and `@feature/sync`, so `features/notes` may not import
  `features/workspace`'s `selectProfileId`.
- **I4** forbids `useAppSelector`/`useAppDispatch` under `src/app/`, so the app route that composes the view may
  not read the store either.

The same knot applies to 015's `PeerCursors`/`LeaderDrawing` (they need `profileId` + `sessionId`) and to 021's
import entry point. It is the *actual* reason these mounts were deferred, more than the missing route.

Three clean resolutions, for a human to choose (this is a boundary decision, not a code detail):

1. **A shared workspace context** — `features/workspace` provides a `profileId`/`sessionId` context defined in
   `shared/`; `features/notes` and `features/presence` consume it via `useContext` (no feature→feature import).
   *Recommended*: no rule bends, and it is the seam the next three mounts all need.
2. **A neutral profile selector** — move `selectProfileId` to a place both features may import (checked against
   the folder law) and read it from `features/notes`.
3. **Lift it through `renderPage`** — the viewer already passes `profileId` in its page args; a small reporter
   component inside `renderPage` lifts it to the app-level composition. Works, but adds render-time machinery.

Recommendation: adopt (1) as a small enabling task, then mount the note sheet, cursors and the import entry point
against it.
