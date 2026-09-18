---
doc_id: thinkboard-lite-frontend-architecture
title: Frontend Architecture — ThinkBoard Lite
version: "1.0"
read_order_position: 3
status: proposed
extends: ["frontend-folder-structure.md", "library-connection-structure.md", "agent-replication-protocol.md"]
companion: ["04-frontend-folder-architecture.md", "thinkboard-lite-frontend.html"]
---

# 03 — Frontend Architecture (ThinkBoard Lite)

> **Companion to the reference architecture, not a replacement.** `frontend-folder-structure.md` is still
> the folder law, `library-connection-structure.md` is still the wiring law, and
> `agent-replication-protocol.md` is still the procedure. This document records the **four places
> ThinkBoard Lite must diverge**, and why each divergence is forced by the product rather than chosen.
>
> Read `01-thinkboard-lite-spec.md` first for product intent. This file governs the frontend only.

---

## 1. Summary of divergence

The reference architecture assumes a **server-of-record app**: RTK Query is the transport, `features/entities`
is an in-memory normalized cache, `redux-persist` keeps a slice of it across reloads.

ThinkBoard Lite is a **local-first app**: the read path must work with the network off, must survive a
reload with the network off, and must hold a 40 MB PDF plus thousands of ink points. Four things change,
and nothing else:

| # | Reference | ThinkBoard Lite | Forced by |
|---|---|---|---|
| **D1** | `features/entities` = `createEntityAdapter` in Redux, persisted to localStorage | `features/entities` = **Dexie (IndexedDB)** tables + live queries | RULE-07 (network never on the read path) and size: localStorage is ~5 MB. The reference itself lists persisting `entities` as deviation #5, wiped by migration v2 — this is that lesson applied at design time |
| **D2** | RTK Query is the transport for everything | RTK Query is the transport for **the four command endpoints only**; all CRUD goes repository → Dexie → sync engine | RULE-02 and RULE-08: a write must land locally and enqueue, not await a response |
| **D3** | Every `.tsx` is pure render, no imperative code | A fourth component tier, `shared/components/canvas/`, has **one named imperative escape hatch** per leaf: `<name>.painter.ts` | 60 fps stylus ink cannot go through React reconciliation. Better one audited file than imperative code leaking everywhere |
| **D4** | 3-point store edit (rootReducer, whitelist, middleware) | **4-point** — plus `listenerMiddleware` registration for anything with a sync or realtime listener | the sync engine is middleware, not a component (§6.4) |

Everything else is copied verbatim: the layer direction, the leaf convention, the barrel contract, the
naming table, the seam discipline, the placement decision tree, the invariant script, the blueprint-first
generation protocol.

**Stack, fixed:** Next.js 16 App Router · React 19 · TypeScript 5 strict · Redux Toolkit + RTK Query ·
redux-persist · Dexie · shadcn/ui + Tailwind v4 · `motion` · `konva` + `react-konva` · `pdfjs-dist` ·
`mermaid` · Vitest + Storybook + Playwright · Supabase.

**No Zustand.** §5.4 states the reasoning.

---

## 2. The layer model

```
┌──────────────────────────────────────────────────────────────────────┐
│  app/            routing & composition only — zero business logic     │
├──────────────────────────────────────────────────────────────────────┤
│  features/       bounded contexts                                     │
│    ├── entities/   KERNEL A — the Dexie mirror of the database        │
│    ├── sync/       KERNEL B — outbox push, realtime pull, reconcile   │
│    └── <context>/  workspace · document · highlight · notes · result  │
├──────────────────────────────────────────────────────────────────────┤
│  shared/         business-agnostic                                    │
│    components/ui/        ATOMS      shadcn, generated, untouched      │
│    components/template/  MOLECULES  DOM, presentational               │
│    components/canvas/    CANVAS     Konva, presentational + painter   │
│    lib/ config/ providers/ types/ utils/ hooks/                       │
└──────────────────────────────────────────────────────────────────────┘

app ──▶ features ──▶ shared          (never backwards)
features ──▶ features:  ONLY toward @feature/entities and @feature/sync
sync ──▶ entities:      allowed
entities ──▶ anything:  FORBIDDEN
```

Two kernels instead of one is the only change to the dependency graph. `entities` owns *what is true*;
`sync` owns *how it gets true*. Contexts depend on both and on neither's internals.

---

## 3. State ownership — the table to settle first

Four stores exist. Putting a fact in the wrong one is the most expensive mistake available, so this table
is normative.

| Kind of state | Home | Persisted by | Read via | Example |
|---|---|---|---|---|
| **Domain rows** | **Dexie** (`features/entities/db`) | IndexedDB | `features/entities/queries/*` live-query hooks | highlights, notes, mini-conclusions, outbox, meta |
| **Large binary** | **OPFS** (`shared/lib/opfs.ts`) | OPFS | `useArtifactFile()` | the PDF bytes |
| **Session + durable UI** | **Redux slices** | `redux-persist` (localStorage) | `useAppSelector` | `currentWorkspaceId`, `mode`, `zoom`, `activeTool`, `openSheet` |
| **60 fps transient** | **`useRef` + imperative paint** | nothing | never rendered through React | live stroke points, peer cursors, pinch delta |

Three rules fall out of it, and they are invariants:

- **I11** — No domain row type may appear in a Redux slice's state. Slices hold **ids and phase**, never
  entities. (The reference says this too; here it is enforceable because entities cannot physically reach
  Redux.)
- **I12** — `redux-persist`'s `whitelist` contains only slices, never a `reducerPath`, and never `entities`.
- **I13** — Peer cursors and in-flight stroke points never pass through `useState`, `useAppSelector` or a
  Dexie live query.

> **Why I13 is not a micro-optimisation.** Five peers at 20 Hz is 100 state updates per second. Through
> React that is 100 reconciliations per second on a tablet that is also rasterising a PDF page and
> capturing a pointer stream. It will drop frames, and the symptom — laggy ink — will be blamed on Konva.

### Why Dexie replaces `createEntityAdapter` rather than sitting beside it

Two caches for the same rows is the worst outcome available, so one of them has to lose. Dexie wins on
four counts the product actually needs:

1. **Survives reload with no network.** A `createEntityAdapter` slice only survives if persisted, and
   persisting it is the reference's own deviation #5.
2. **Capacity.** localStorage is ~5 MB. One workspace of ink strokes exceeds it.
3. **Queryability.** `db.highlights.where('[artifactId+page]').equals([a, 3])` is an index hit. The
   adapter's `selectAll().filter()` is O(n) on every render.
4. **Transactional writes.** RULE-08 requires the row and its outbox entry to land atomically. Dexie gives
   that in one `db.transaction('rw', …)`. Two Redux dispatches do not.

**What is preserved exactly:** the *role* of the kernel. One normalized mirror of the database, one read
surface, every context reads it, it imports nothing from other contexts. Only the mechanism changed.

---

## 4. The three data flows

Every piece of data movement in the app is one of these three. An agent that can name which flow it is
implementing will not get the wiring wrong.

### 4.1 Local write — the common case

```
container hook
   └─▶ repository.createHighlight(input)            @feature/entities/repository
          └─▶ db.transaction('rw', highlights, outbox, …)     ← ONE transaction
                 ├─ highlights.add(row)              uuidv7 generated client-side
                 └─ outbox.add({ op:'insert', … })
   ⇢ Dexie fires a change event
   └─▶ useLiveQuery re-runs ──▶ container re-renders
   ⇢ listenerMiddleware wakes, drains the outbox in seq order  @feature/sync
```

The UI never waits for the server. There is no optimistic-update code, because there is nothing to be
optimistic about: you wrote to the database the UI renders from.

### 4.2 Remote change — a teammate's highlight

```
Realtime broadcast  →  sync/realtime/channel.ts
   └─▶ dispatch(remoteChangeReceived(payload))       visible in DevTools
          └─▶ listener: repository.applyRemote(payload)   writes Dexie WITHOUT an outbox entry
   ⇢ same live query re-runs ──▶ same re-render path
```

**The property worth protecting:** a remote change and a local pen stroke take the identical path into the
UI. One rendering path to debug, not two.

### 4.3 Command — the four RPC endpoints

`POST /workspaces`, `POST /highlights/:id/mini-conclusion`, `POST /workspaces/:id/results`,
`GET /runs/:id/stream`. These have no local equivalent: they run a model call on the server.

```
container hook
   └─▶ useGenerateResultMutation().unwrap()         RTK Query, status only
          ├─ isLoading / isError drive the button
          └─ returns { runId } — an ID, never a row
   ⇢ the server writes the run; the broadcast brings it back through 4.2
   └─▶ useRunQuery(runId)  ← a Dexie live query, not an RTK Query hook
```

- **I14** — `const { data } = useXQuery()` in a container is a defect (inherited from the reference's I8).
  In Lite it is stronger: a command may return an **id or a status**, never a domain row.
- **I15** — `createApi` exists only for the four command endpoints in the blueprint. A `createApi` whose
  endpoints are CRUD-shaped is a defect; it belongs in the repository.

---

## 5. Redux composition

### 5.1 Slices

Each follows the reference's state-shape convention — `phase`, config, `engine`, `ui` — with `engine` kept
only where there is a real progression to track.

| Slice | `phase` | config | `ui` (never persisted) |
|---|---|---|---|
| `session` | `idle \| authenticated \| expired` | `profileId`, `identityKind` | `error` |
| `workspace` | `loading \| ready \| missing` | `currentWorkspaceId`, `currentArtifactId` | `openSheet`, `error` |
| `viewport` | — | `zoom`, `pageCursor`, `rotation` | `isPanning` |
| `canvas` | — | `activeTool`, `activeColor`, `activeLayer` | `selectedHighlightId`, `isDrawing` |
| `sync` | `collaboration \| offline` | — | `pendingCount`, `lastSyncedAt`, `syncError` |
| `result` | `idle \| running \| done \| failed` | `activeTab`, `runningRunId` | `error` |

`sync.phase` is the mode switch and is the one slice field the user toggles directly.

### 5.2 Persistence

```ts
whitelist: ["session", "workspace", "viewport", "sync"]   // slices only — never entities, never a reducerPath
transforms: [stripUi]                                     // see below
```

`stripUi` is a `createTransform` that drops every slice's `ui` sub-object on the way out. This is the
correct fix for the reference's deviation #8 ("`ui` state is inside the persisted slice") — it costs eight
lines and removes a whole class of rehydration bug.

- **I16** — Every persisted slice keeps its throwaway state under `ui`, and `stripUi` is registered in
  `persistConfig.transforms`.

### 5.3 The 4-point store edit

The reference's three-point edit becomes four whenever a context ships a listener:

```ts
// 1. rootReducer          slice or api reducer
// 2. persistConfig        slices only
// 3. .concat()            api middleware
// 4. .prepend()           listenerMiddleware.middleware   ← once, and every listener registered to it
```

Point 4 is registered exactly once in `store.ts`; individual listeners are added through
`startAppListening` in their own context. Missing point 4 fails the same way missing point 3 does —
silently.

### 5.4 Why Redux Toolkit and not Zustand

Staying on RTK is the right call here for three reasons that have nothing to do with taste:

1. **The whole reference protocol is built on it.** `verify-architecture.mjs` checks the store seam;
   `vi.mock('@shared/config/redux/hooks')` mocks any container hook in three lines. A second store library
   means a second seam, a second mock pattern, and a verify script that cannot see half the state.
2. **Offline sync is exactly the case where DevTools earns its keep.** An outbox drain is a sequence of
   dispatched actions — `outboxQueued`, `outboxSending`, `outboxConfirmed`, `remoteChangeReceived`. You can
   read the whole sync history in the action log and time-travel through a failed drain. With a
   subscription store you are back to `console.log`.
3. **The state Zustand would be good at, we are not putting in a store at all.** Cursors and stroke points
   go to refs (I13). The remaining UI state is small, structured and benefits from the discipline.

So: **one store library, one seam, refs for the fast path.** Do not add Zustand later "just for the
canvas" — that is precisely the state that must not be in any store.

---

## 6. Subsystems

### 6.1 The canvas tier (D3)

A PDF page is three stacked layers, and each has a different owner:

```
┌─ page container (DOM, positioned)  ─────────────────────────┐
│  z0  <canvas>   PDF.js render output          imperative    │
│  z1  <div>      PDF.js text layer (real spans) DOM, selectable│
│  z2  <Stage>    Konva: existing marks + live stroke          │
│  z3  <div>      DOM overlay: chips, note pins  motion.js     │
└──────────────────────────────────────────────────────────────┘
```

**Text highlights come from z1, never z2.** The Selection/Range API over the text layer gives the exact
string for free. Konva owns z2: freehand ink, marquee regions, and drawing the *stored* geometry of every
highlight regardless of how it was captured.

A canvas leaf has three files instead of two:

```
highlight-layer/
├── highlight-layer.tsx          react-konva declarative tree — Layer, Rect, Line
├── use-highlight-layer.ts       logic: live queries, dispatch, derived props
├── highlight-layer.painter.ts   THE EXCEPTION: refs, rAF, batchDraw, live stroke
├── types.ts
├── highlight-layer.test.ts
└── index.ts
```

- **I17** — Imperative Konva (`batchDraw`, `.getLayer()`, `new Konva.*`, direct node mutation) appears only
  in `*.painter.ts`. Anywhere else it is a defect.
- **I18** — A painter takes a `Konva.Layer` ref plus plain data and returns a disposer. It never imports
  `@shared/config/redux/hooks`, never reads Dexie, never dispatches.

The painter is where the live stroke lives: `pointermove` pushes into a ref array, one rAF tick calls
`layer.batchDraw()`. On `pointerup` the hook converts the ref buffer into normalized page-relative
coordinates and calls `repository.createHighlight()` — the first and only time that stroke touches state.

- **I19** — Coordinates crossing out of a painter are normalized page-relative (0–1), never viewport
  pixels. This is the frontend half of RULE-17, and it is what makes highlights survive zoom and rotation.

### 6.2 PDF and virtualization

`pdfjs-dist` behind `shared/lib/pdf.ts`. Render a window of ±1 page around the cursor; unmount the Konva
Stage of any page outside it. A 200-page document with 200 live Stages is an out-of-memory crash on an
iPad, and it will look like a Konva bug.

### 6.3 Motion

`motion` animates DOM only: sheets, chips, page transitions, the sync status pill.

- **I20** — No `motion` import inside `shared/components/canvas/**`. Konva has its own tween loop; running
  both against the same element produces jank that is very hard to attribute.
- Motion state is derived from props, never held in its own `useState` (inherited from the reference §9).
- Every transition respects `prefers-reduced-motion`.

### 6.4 The sync engine as middleware

The engine is `createListenerMiddleware`, not a mounted component. Three reasons: it stays out of the
React tree so it cannot be unmounted by a route change; it lives in the store seam so there is exactly one
place to look; and every step it takes is a dispatched action, which is the debugging property §5.4 is
about.

```
features/sync/
├── middleware/sync-listener.ts     startAppListening effects, registered in store.ts
├── outbox/{push.ts,backoff.ts}     drain in seq order; 5xx → backoff, 4xx → park
├── realtime/channel.ts             one socket, two topics: ws:{sessionId} + user:{profileId}
├── reconcile/manifest-diff.ts      push → pull → resubscribe
├── stores/sync-slice.ts
└── selectors/sync-selectors.ts
```

- **I21** — `@supabase/supabase-js` is imported only in `shared/lib/supabase.ts` and
  `features/sync/realtime/channel.ts`. A context that talks to Supabase directly has bypassed the outbox.
- **I22** — `supabase.realtime.setAuth()` is called before `subscribe()` and again on every token refresh.
  Skipping the second one makes the channel stop delivering, silently, about an hour in.

### 6.5 Handwriting input

The ink pad is a canvas leaf inside a shadcn `Dialog` (desktop) / `Sheet side="bottom"` (tablet). Strokes
are captured as `{x, y, t, pressure}` and stored as the note's `ink`; the transcript is a derived,
editable field. The transcription ladder lives behind `shared/lib/handwriting.ts` so tiers can be swapped
without touching a component — feature-detect `navigator.createHandwritingRecognizer`, else queue a
command-endpoint call, else stay as ink.

---

## 7. Devices

Tablet is the authoring device, desktop the analysis device, mobile the reading device. Say it in the
product rather than pretending to parity on a 390 px viewport.

| Capability | Mobile < 768 | Tablet 768–1279 | Desktop ≥ 1280 |
|---|---|---|---|
| Read document, highlights, notes | ✅ | ✅ | ✅ |
| Write a note (keyboard) | ✅ | ✅ | ✅ |
| Create text-layer highlights | ⚠️ tap-and-hold | ✅ | ✅ |
| Freehand ink / marquee (Konva z2) | ❌ | ✅ **primary**, stylus | ✅ mouse marquee |
| Sheets | full-screen, one at a time | right sheet, one at a time | docked right rail |
| Run a Result | ✅ | ✅ | ✅ |

Implementation notes that are easy to get wrong:

- **Pointer Events only.** Never mouse-only. `pointerType === 'pen'` once seen in a session enables palm
  rejection by ignoring `touch` for drawing.
- **`touch-action: none` on the Stage only while a draw tool is active**, restored on release — otherwise
  the page fights every stroke, or scrolling dies.
- One breakpoint hook, `useBreakpoint()` in `shared/hooks`, is the single source of device branching. Media
  queries scattered through containers drift.
- Mobile ships last (his stated order) but the breakpoint hook and the sheet component ship in week one, so
  mobile is a layout pass rather than a rewrite.

---

## 8. Libraries and their seams

Extends `library-connection-structure.md` §1. New rows are marked ➕.

| Concern | Library | Seam — the only place it is configured |
|---|---|---|
| Routing / SSR | `next` 16 | `src/app/layout.tsx` |
| State container | `@reduxjs/toolkit` | `shared/config/redux/store.ts` |
| Store access | `react-redux` | `shared/config/redux/hooks.ts` |
| Persistence | `redux-persist` | `store.ts` + `shared/providers/redux-provider` |
| Command transport | RTK Query `fetchBaseQuery` | `shared/lib/fetch-base-query.ts` |
| ➕ **Local database** | `dexie`, `dexie-react-hooks` | `features/entities/db/thinkboard-db.ts` |
| ➕ **Large files** | OPFS (platform) | `shared/lib/opfs.ts` |
| ➕ **Realtime + auth** | `@supabase/supabase-js` | `shared/lib/supabase.ts` + `features/sync/realtime/channel.ts` |
| ➕ **PDF** | `pdfjs-dist` | `shared/lib/pdf.ts` |
| ➕ **Canvas** | `konva`, `react-konva` | `shared/components/canvas/**` only |
| ➕ **OCR** | `tesseract.js` | `shared/lib/ocr.ts` (Worker, lazy) |
| ➕ **Handwriting** | tiered | `shared/lib/handwriting.ts` |
| ➕ **Diagrams** | `mermaid` | `shared/components/template/mermaid-figure/` |
| ➕ **Service worker** | `@serwist/next` | `app/sw.ts` + `next.config.ts` |
| ➕ **Zip export** | `fflate` | `shared/lib/bundle.ts` |
| Class merging | `clsx` + `tailwind-merge` | `shared/lib/shadcn.ts` (`cn()`) |
| Theming | `next-themes` | `shared/providers/theme-provider` |
| Toasts | `sonner` | `shared/components/ui/sonner.tsx` |
| Animation | `motion` | presentational DOM only — never `components/canvas/**` |
| Forms | `react-hook-form` + a resolver | `use-*.ts` only; schema in `<component>/schema.ts` |

Every ➕ row was run through the §13 seven-question checklist. The two that needed a decision:

- **Dexie needs a provider?** No. The db is a module singleton, which is safe because it is browser-only and
  the file carries `"use client"`. It is not per-request state like the Redux store.
- **Konva needs SSR handling?** Yes. `react-konva` touches `window` at import. Every canvas leaf is
  `"use client"`, and the page-level canvas host is loaded with `dynamic(..., { ssr: false })`.

---

## 9. Testing

The reference's three shapes carry over. Two are added.

| Shape | Location | Mocked seam |
|---|---|---|
| Slice test | `stores/*-slice.test.ts` | nothing — plain reducer calls |
| Hook test | `use-*.test.ts` | `@shared/config/redux/hooks` |
| Component test | `*.test.tsx` | `@shared/config/redux/hooks`, RTK Query hooks, `sonner` |
| ➕ **Repository test** | `features/entities/repository/*.test.ts` | `fake-indexeddb` — real Dexie, fake backend. Asserts row **and** outbox landed, or neither |
| ➕ **Sync test** | `features/sync/**/*.test.ts` | `@shared/lib/supabase`. Asserts seq order, coalescing, 4xx parking, push→pull→resubscribe order |

`fake-indexeddb` is worth the dependency: a repository test that runs against real Dexie catches
transaction-scope bugs that a mocked db never will, and those are precisely the bugs that lose a user's
note.

Painters are tested through their hook, not directly — a painter's contract is "given data and a layer ref,
draw and dispose", and asserting pixels is not worth the harness.

---

## 10. Invariants — the additions

Extend `scripts/verify-architecture.mjs` with these. A rule not in the script is not a rule.

| # | Rule | Detection sketch |
|---|---|---|
| I11 | No domain row type in a slice's state | grep slice state types for `@shared/types/domain` imports |
| I12 | `whitelist` has no `reducerPath` and no `entities` | parse `store.ts` |
| I13 | No cursor/stroke state in React | grep `useState` in `features/presence/**` and `*.painter.ts` siblings |
| I14 | No `data` destructured from a query hook in a container | reference I8, unchanged |
| I15 | Every `createApi` endpoint appears in `blueprint.commands[]` | cross-check blueprint |
| I16 | Every persisted slice has a `ui` key; `stripUi` is registered | parse `store.ts` + slice types |
| I17 | Imperative Konva only in `*.painter.ts` | grep `batchDraw\|new Konva\.\|getLayer()` outside painters |
| I18 | A painter imports no store hook, no Dexie | grep imports in `*.painter.ts` |
| I19 | No painter returns raw viewport pixels | review gate — flag `clientX\|offsetX` crossing a return |
| I20 | No `motion` import under `components/canvas/**` | grep |
| I21 | `@supabase/supabase-js` only in its two seam files | grep |
| I22 | `setAuth()` called before every `subscribe()` | grep in `channel.ts`, plus a unit test |
| I23 | `useLiveQuery` only inside `features/entities/queries/**` | grep — containers must call a named query hook |
| I24 | Every canvas leaf is `"use client"` | grep first line |

I1–I10 from the reference are unchanged and still apply.

---

## 11. Blueprint extensions

`architecture.blueprint.json` gains four keys so an agent can generate this app without inference:

```jsonc
{
  "localFirst": {
    "db": "features/entities/db/thinkboard-db.ts",
    "dexieVersion": 1,
    "tables": ["meta","artifacts","highlights","notes","miniConclusions","outbox"],
    "blobStore": "opfs",
    "idStrategy": "uuidv7-client"
  },
  "commands": [
    { "name": "create-workspace",  "method": "POST", "url": "/v1/workspaces",                    "returns": "id" },
    { "name": "mini-conclusion",   "method": "POST", "url": "/v1/highlights/:id/mini-conclusion", "returns": "status" },
    { "name": "generate-result",   "method": "POST", "url": "/v1/workspaces/:id/results",         "returns": "id" },
    { "name": "run-stream",        "method": "GET",  "url": "/v1/runs/:id/stream",                "returns": "sse" }
  ],
  "canvasLeaves": [
    { "name": "highlight-layer", "hasPainter": true,  "layer": "z2" },
    { "name": "ink-pad",         "hasPainter": true,  "layer": "modal" },
    { "name": "peer-cursors",    "hasPainter": true,  "layer": "z2" }
  ],
  "listeners": [
    { "context": "sync", "on": ["workspaceOpened","outboxQueued","modeChanged","remoteChangeReceived"] }
  ]
}
```

- **I25** — Every `canvasLeaves[].hasPainter: true` entry has a `*.painter.ts`, and every `*.painter.ts`
  traces to a blueprint entry.

---

## 12. Generation order

The reference DAG with two phases inserted. The insertion points matter: the local database must exist
before any context writes, and the sync engine must exist before any context expects a write to reach the
server.

```
P1 scaffold ─▶ P2 shared-foundation ─▶ P3 atoms ─▶ P4 entities-kernel (DEXIE)
                                                        │
                                          ┌─────────────┴─────────────┐
                                          ▼                           ▼
                               P4b sync-kernel              P6 shared templates
                                          │                  P6b canvas leaves
                                          ▼                           │
                               P5 command apis + slices ──────────────┤
                                                                      ▼
                                                        P7 containers ─▶ P8 routes ─▶ P9 audit
```

| Phase | Produces | Gate |
|---|---|---|
| **P4 entities-kernel** | Dexie schema, repository, query hooks | repository tests green under `fake-indexeddb`; row + outbox atomicity proven |
| **P4b sync-kernel** | outbox push, realtime channel, reconcile, listener registered | sync tests green: seq order, coalescing, 4xx parking, push→pull→resubscribe |
| **P6b canvas leaves** | `shared/components/canvas/*` with painters | Storybook renders each leaf with fixture data; I17–I20 clean |

**The single most likely agent failure in this project** is generating P7 containers before P4b — you get
containers that call Supabase directly, the outbox is never used, and offline silently does not work while
everything looks fine on a good connection. The reference warns about the analogous P7-before-P4 failure;
this is the same mistake one layer out.

---

## 13. Open questions for validation

Defaults are taken so work is not blocked, but each of these changes real code and is cheap to change now.

| # | Question | Default taken |
|---|---|---|
| **Q1** | Dexie as the read model, or keep `createEntityAdapter` + persist and accept the 5 MB ceiling? | **Dexie** (§3) |
| **Q2** | RTK Query scoped to the four commands, or used for all reads with Dexie as a cache underneath? | **commands only** (§4.3) |
| **Q3** | `sync` as listener middleware, or as a mounted `<SyncProvider>` component? | **middleware** (§6.4) |
| **Q4** | Is `shared/components/canvas/` a third tier, or do canvas leaves live inside `features/document/`? | **third tier** — they are presentational and reusable across contexts |
| **Q5** | Storybook for canvas leaves — worth the Playwright setup for Konva, or unit-test the hooks only? | **stories, yes**, with fixture strokes |
| **Q6** | Mobile at the end, or the breakpoint hook and sheet from week one with mobile layout last? | **hook early, layout last** (§7) |
