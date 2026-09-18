---
doc_id: thinkboard-lite-frontend-folder-architecture
title: Frontend Folder Architecture — ThinkBoard Lite
version: '1.0'
read_order_position: 4
status: proposed
extends: frontend-folder-structure.md
companion: ['03-frontend-architecture.md', 'thinkboard-lite-frontend.html']
---

# 04 — Frontend Folder Architecture (ThinkBoard Lite)

> **Normative.** Anything not described here does not exist in the architecture and must not be invented.
> This document is the ThinkBoard Lite instance of `frontend-folder-structure.md`; that file remains the
> general law and this one records where the instance differs. `03-frontend-architecture.md` explains _why_.

---

## 1. Design lineage

Unchanged from the reference, plus one axis:

| Source                     | Governs                                         | Lives in                                      |
| -------------------------- | ----------------------------------------------- | --------------------------------------------- |
| **DDD (bounded contexts)** | vertical slicing by business capability         | `src/features/<context>/`                     |
| **Bulletproof React**      | dependency direction `app → features → shared`  | enforced by ESLint + `verify:arch`            |
| **Atomic Design**          | horizontal slicing of presentational components | `shared/components/{ui,template,canvas}`      |
| **UI / Logic separation**  | every component is a dumb render + a hook       | `x.tsx` + `use-x.ts`                          |
| ➕ **Local-first**         | where truth lives and how it moves              | `features/entities` (Dexie) + `features/sync` |

> DDD cuts vertically. Atomic Design cuts horizontally. Bulletproof defines the direction of gravity.
> UI/Logic separation defines the shape of a leaf. **Local-first defines where the floor is.**

---

## 2. Top-level tree

```
frontend-thinkboard-lite/
├── src/
│   ├── app/                     # Layer 3 — routing & composition ONLY
│   ├── features/                # Layer 2 — bounded contexts
│   ├── shared/                  # Layer 1 — business-agnostic
│   └── stories/                 # Storybook scaffold (not app code)
├── public/
├── .storybook/
├── scripts/verify-architecture.mjs
├── architecture.blueprint.json  # source of truth for what exists
├── AGENTS.md                    # cold-start brief for the next agent
├── components.json              # shadcn CLI alias map
├── tsconfig.json                # path aliases — source of truth
├── vitest.config.mts            # MUST mirror tsconfig aliases
├── next.config.ts               # + Serwist service worker
├── eslint.config.mjs
└── package.json
```

The Supabase project stays where it already is, in `thinkboard-supabase/`. This repository is frontend
only; there are no Edge Functions, because Lite's four server endpoints are Next.js route handlers
(§3.2).

### Path aliases — declared twice, always

```jsonc
{
	"@app/*": ["./src/app/*"],
	"@feature/*": ["./src/features/*"],
	"@shared/*": ["./src/shared/*"],
	"@public/*": ["./public/*"],
}
```

> **Rule (reference I6, unchanged):** aliases live in `tsconfig.json#compilerOptions.paths` **and**
> `vitest.config.mts#resolve.alias`. One without the other is the single most common cause of
> "works in dev, fails in test". Both, or neither.

---

## 3. Layer 3 — `src/app/`

### 3.1 Routes

```
src/app/
├── layout.tsx                # RootLayout — the only global composition
├── page.tsx                  # landing / workspace picker
├── globals.css               # Tailwind v4 entry + shadcn theme tokens
├── sw.ts                     # Serwist service worker entry
├── auth/page.tsx
├── w/
│   ├── page.tsx              # workspace list
│   └── [workspaceId]/
│       ├── page.tsx          # THE screen — client component, no SSR data
│       └── loading.tsx
└── api/v1/                   # the four command endpoints — see 3.2
```

**Allowed in a `page.tsx`:** layout wrappers, a heading, `<FeatureContainer />` imports, `metadata`.
**Forbidden:** `useState`, `useEffect`, `useAppSelector`, `useAppDispatch`, `fetch`, RTK Query hooks,
any conditional rendering driven by domain state.

`w/[workspaceId]/page.tsx` is the ceiling of complexity for a route in this project:

```tsx
import dynamic from 'next/dynamic';

// react-konva touches window at import time — the whole workspace shell is client-only
const WorkspaceShell = dynamic(
	() =>
		import('@feature/workspace/components/workspace-shell').then(
			(m) => m.WorkspaceShell,
		),
	{ ssr: false },
);

export default function WorkspacePage() {
	return <WorkspaceShell />;
}
```

### 3.2 `app/api/v1/` — the four command endpoints

```
src/app/api/v1/
├── workspaces/route.ts                        POST   create workspace
├── highlights/[id]/mini-conclusion/route.ts   POST   one cheap model call
├── workspaces/[id]/results/route.ts           POST   individual | group run
└── runs/[id]/stream/route.ts                  GET    SSE
```

Handlers **bind, call one service method, map the error** — the reference's handler contract, unchanged.
Business logic lives in `src/server/`, which is the future Go gateway in TypeScript and is governed by
`01-thinkboard-lite-spec.md` §4.2, not by this document.

- No fifth endpoint without a `blueprint.commands[]` entry.
- Nothing CRUD-shaped goes here. If the client can do it through the repository, it does.

### 3.3 `layout.tsx` composition order

```
<html> → <body>
  └── <LibraryProvider>            shared/providers/index.tsx
      └── <AuthGuard>              route-level access policy
          ├── <AppHeader />        mode switch, theme switch, sync pill
          └── <main>{children}</main>
```

---

## 4. Layer 2 — `src/features/`

```
src/features/
├── entities/      # KERNEL A — the Dexie mirror of the database
├── sync/          # KERNEL B — outbox push, realtime pull, reconcile
├── workspace/     # create, members, leader, persona, goal, the shell
├── document/      # PDF load, page windowing, zoom/pan viewport
├── highlight/     # capture, layers, promotion
├── notes/         # individual/group notes, keyboard + ink, transcription
├── result/        # runs, temperature, renderings
└── presence/      # cursors and who is here — ref-based, no store
```

One folder per **bounded context**, never per page and never per component.

### 4.1 `features/entities/` — KERNEL A

Not a feature. The normalized client-side mirror of the database, and the only read surface for domain
rows. Replaces the reference's `createEntityAdapter` slice; keeps its role exactly.

```
src/features/entities/
├── db/
│   ├── thinkboard-db.ts           # "use client" — the Dexie instance + schema
│   ├── migrations.ts              # db.version(n).stores(...).upgrade(...)
│   └── index.ts
├── repository/                    # THE WRITE SURFACE — row + outbox, one transaction
│   ├── highlight-repository.ts
│   ├── note-repository.ts
│   ├── artifact-repository.ts
│   ├── apply-remote.ts            # remote changes: write WITHOUT an outbox entry
│   ├── *.test.ts                  # against fake-indexeddb
│   └── index.ts
├── queries/                       # THE READ SURFACE — named live-query hooks
│   ├── use-highlights-for-page.ts
│   ├── use-notes-for-highlight.ts
│   ├── use-outbox-count.ts
│   ├── use-run.ts
│   └── index.ts
├── types/
│   ├── rows.ts                    # local row shapes = domain type + _dirty
│   ├── outbox.ts
│   └── index.ts
└── utils/normalizers.ts           # wire shape → row shape
```

```ts
// db/thinkboard-db.ts
'use client';
import Dexie, { type EntityTable } from 'dexie';

export const db = new Dexie('thinkboard') as Dexie & {
	meta: EntityTable<MetaRow, 'key'>;
	artifacts: EntityTable<ArtifactRow, 'id'>;
	highlights: EntityTable<HighlightRow, 'id'>;
	notes: EntityTable<NoteRow, 'id'>;
	miniConclusions: EntityTable<MiniConclusionRow, 'highlightId'>;
	outbox: EntityTable<OutboxOp, 'seq'>;
};

db.version(1).stores({
	meta: 'key',
	artifacts: 'id, sessionId',
	highlights: 'id, [artifactId+page], layer, _dirty',
	notes: 'id, highlightId, profileId, _dirty',
	miniConclusions: 'highlightId',
	outbox: '++seq, rowId, table',
});
```

**Rules:**

1. `entities` imports **nothing** from other features. Every feature may import it.
2. Components never touch `db` directly. Writes go through `repository/`, reads through `queries/`.
3. `useLiveQuery` appears **only** inside `queries/` (I23). A container calls
   `useHighlightsForPage(artifactId, page)`, never `useLiveQuery(() => db.highlights…)`.
4. Every repository write is one `db.transaction("rw", …)` containing the row **and** its outbox entry.
5. `apply-remote.ts` is the only writer that omits the outbox entry — a remote change must not be
   echoed back to the server.

### 4.2 `features/sync/` — KERNEL B

```
src/features/sync/
├── middleware/
│   ├── sync-listener.ts           # startAppListening effects; registered in store.ts
│   └── sync-listener.test.ts
├── outbox/
│   ├── push.ts                    # drain in seq order; upsert onConflict ignore
│   ├── coalesce.ts                # ≤1 pending update per row
│   ├── backoff.ts                 # 5xx/network → retry; 4xx → park as failed
│   └── *.test.ts
├── realtime/
│   ├── channel.ts                 # setAuth → subscribe ws:{sessionId} + user:{profileId}
│   ├── handlers.ts                # broadcast payload → applyRemote
│   └── *.test.ts
├── reconcile/
│   ├── manifest-diff.ts           # push → pull → resubscribe
│   └── manifest-diff.test.ts
├── stores/sync-slice.ts
├── selectors/sync-selectors.ts
├── types/redux.ts
└── components/sync-status-pill/   # the only visible surface of this context
```

`sync` may import `entities`. Nothing imports `sync` except `store.ts` (the listener registration),
`app/layout.tsx` (the status pill) and `features/workspace` (the mode switch).

### 4.3 Canonical context skeleton

Every other context follows the reference skeleton exactly:

```
src/features/<context>/
├── api/<x>-api/                 # ONLY for a blueprint command endpoint
│   ├── <x>-api.ts
│   ├── <x>-api.test.ts
│   └── index.ts
├── components/<name>/           # CONTAINERS — store-aware, orchestrating
│   ├── <name>.tsx
│   ├── use-<name>.ts
│   ├── types.ts
│   ├── <name>.stories.tsx
│   ├── <name>.test.tsx
│   └── index.ts
├── stores/<context>-slice.ts (+ .test.ts)
├── selectors/<context>-selectors.ts
├── types/redux.ts
└── utils/
```

Create a subfolder when it has ≥1 real member, never as an empty placeholder. `presence/` has no
`api/` and no `selectors/`; `document/` has no `api/`.

### 4.4 Slice state shape

The reference's convention, applied:

```ts
// features/canvas or features/highlight — types/redux.ts
export type CanvasState = {
	tool: { active: ToolKind; color: HighlightColor; layer: HighlightLayer }; // config
	ui: {
		selectedHighlightId: string | null;
		isDrawing: boolean;
		error: string | null;
	};
};

export type SyncState = {
	phase: SyncMode; // "collaboration" | "offline"
	engine: {
		pendingCount: number;
		lastSyncedAt: string | null;
		failedCount: number;
	};
	ui: { error: string | null };
};
```

- `phase` is a string union state machine, never a boolean soup.
- `ui` is throwaway and is **stripped from persistence** by the `stripUi` transform.
- **A slice never stores a domain row.** It stores ids and phase. Rows live in Dexie, once.

---

## 5. Layer 1 — `src/shared/`

```
src/shared/
├── api/                      # cross-context command APIs (rare — most live in a context)
├── components/
│   ├── ui/                   # ATOMS      — shadcn, generated, untouched
│   ├── template/             # MOLECULES  — DOM, presentational
│   └── canvas/               # ➕ CANVAS  — Konva, presentational + painter
├── config/
│   └── redux/
│       ├── store.ts          # single composition root — the 4-point edit
│       ├── hooks.ts          # typed useAppDispatch / useAppSelector / useAppStore
│       ├── listener.ts       # createListenerMiddleware + startAppListening
│       └── persist.ts        # persistConfig + stripUi transform + migrations
├── hooks/
│   ├── use-breakpoint.ts     # the ONLY source of device branching
│   ├── use-online.ts
│   └── index.ts
├── lib/                      # third-party adapters — one file per library
│   ├── shadcn.ts             # cn()
│   ├── utils.ts              # re-export of cn for the shadcn CLI alias
│   ├── fetch-base-query.ts
│   ├── supabase.ts
│   ├── pdf.ts
│   ├── ocr.ts
│   ├── handwriting.ts
│   ├── opfs.ts
│   ├── bundle.ts             # fflate export/import
│   ├── slug.ts               # h-p{page}-{order}-{hash}
│   └── index.ts
├── providers/
│   ├── index.tsx             # LibraryProvider — the only export app/ uses
│   ├── redux-provider/
│   ├── shadcn-provider/
│   └── theme-provider/
├── types/
│   ├── api.ts                # ApiResponse<T> envelope
│   └── domain/               # 1:1 mirror of DB tables, snake_case, branded ids
│       ├── common.ts         # UUID, ISODateString
│       ├── profiles.ts  teams.ts  sessions.ts  artifacts.ts
│       ├── highlights.ts  highlight-notes.ts  mini-conclusions.ts
│       └── runs.ts
└── utils/                    # pure, dependency-free
    ├── geometry.ts           # normalize / denormalize page-relative rects
    ├── throttle.ts
    └── index.ts
```

### 5.1 Atomic Design mapping — three tiers

| Atomic term                       | Folder                        | Rule                                                                         |
| --------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| Atoms                             | `shared/components/ui/`       | `npx shadcn add`. Hand-edit only for theme wiring. No domain imports, ever.  |
| Molecules + Organisms (DOM)       | `shared/components/template/` | Hand-written compositions of atoms. Presentational. `use-*.ts` derives only. |
| ➕ Molecules + Organisms (canvas) | `shared/components/canvas/`   | react-konva. Presentational. **May have one `*.painter.ts`.**                |
| Templates                         | `features/*/components/*`     | Containers. Store-aware.                                                     |
| Pages                             | `src/app/**/page.tsx`         | Route composition.                                                           |

`components.json` binds the shadcn CLI:

```jsonc
{
	"aliases": {
		"ui": "src/shared/components/ui",
		"components": "src/shared/components/template",
		"lib": "src/shared/lib",
		"utils": "src/shared/lib/utils",
		"hooks": "src/shared/hooks",
	},
}
```

> ⚠️ `shadcn add` writes multi-part blocks to the `components` alias — i.e. into `template/`. After every
> CLI run, verify nothing domain-flavoured landed there, and that nothing landed in `canvas/`.

### 5.2 `shared/components/canvas/` in detail

```
src/shared/components/canvas/
├── page-stage/              # the Konva Stage host for one PDF page
├── highlight-layer/         # draws stored highlights + the live stroke
├── ink-pad/                 # the handwriting surface
├── peer-cursors/            # other members' pointers — ref-driven, never re-renders
└── marquee/                 # region selection rectangle
```

Each leaf:

```
highlight-layer/
├── highlight-layer.tsx          # "use client" — react-konva declarative tree ONLY
├── use-highlight-layer.ts       # logic: derived props, callbacks
├── highlight-layer.painter.ts   # THE EXCEPTION: refs, rAF, batchDraw
├── types.ts
├── highlight-layer.stories.tsx
├── highlight-layer.test.ts
└── index.ts
```

**Painter contract:**

```ts
// highlight-layer.painter.ts
import type Konva from 'konva';

export type Painter = {
	push(pt: Point): void;
	commit(): Point[];
	dispose(): void;
};

export function createStrokePainter(
	layer: Konva.Layer,
	style: StrokeStyle,
): Painter {
	/* … */
}
```

- Takes a layer ref plus plain data; returns a disposer.
- Imports **no** store hook, **no** Dexie, **no** feature module.
- Coordinates leaving a painter are page-relative 0–1, never viewport pixels.
- It is the only file in the repository allowed to call `batchDraw()`, `new Konva.*` or mutate a node.

---

## 6. The leaf convention — three kinds

| Kind               | Where                                | Files                                                                                                                       | Hook does                                                           |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Template leaf**  | `shared/components/template/<name>/` | `.tsx`, `use-*.ts`, `types.ts`, `index.ts`, `*.test.tsx`, `*.stories.tsx`, optional `-skeleton.tsx`, optional `.module.css` | **derivation only** — no dispatch, no fetch, no router              |
| **Canvas leaf**    | `shared/components/canvas/<name>/`   | as above **+ `*.painter.ts`**                                                                                               | derivation + painter lifecycle                                      |
| **Container leaf** | `features/<ctx>/components/<name>/`  | `.tsx`, `use-*.ts`, `types.ts`, `index.ts`, `*.test.tsx`, `*.stories.tsx`                                                   | **orchestration** — dispatch, query hooks, repository calls, router |

### 6.1 The barrel is the contract

```ts
// shared/components/canvas/highlight-layer/index.ts
export * from './highlight-layer';
export * from './use-highlight-layer';
export * from './types';
// NOTE: the painter is NOT exported — it is an implementation detail of this leaf
```

Consumers import `@shared/components/canvas/highlight-layer`, never
`.../highlight-layer/highlight-layer`. Deep imports are a defect.

- **A painter is never exported from its barrel.** If another leaf needs it, it is not a painter — it is a
  utility, and it belongs in `shared/utils/`.

### 6.2 UI/Logic separation with a local-first read

```tsx
// features/highlight/components/highlight-sheet/highlight-sheet.tsx
"use client";
import { useHighlightSheet } from "./use-highlight-sheet";

export function HighlightSheet() {
    const { highlights, isEmpty, selectedId, onSelect, onPromote } = useHighlightSheet();
    return (/* JSX ONLY */);
}
```

```ts
// use-highlight-sheet.ts
'use client';
import { useAppDispatch, useAppSelector } from '@shared/config/redux/hooks';
import { useHighlightsForPage } from '@feature/entities/queries';
import { highlightRepository } from '@feature/entities/repository';
import {
	selectCurrentPage,
	selectSelectedHighlightId,
} from '@feature/document/selectors';
import { selectHighlight } from '@feature/highlight/stores/highlight-slice';

export function useHighlightSheet() {
	const dispatch = useAppDispatch();
	const page = useAppSelector(selectCurrentPage);
	const selectedId = useAppSelector(selectSelectedHighlightId);
	const highlights = useHighlightsForPage(page) ?? []; // ← rows come from Dexie

	const onSelect = (id: string) => dispatch(selectHighlight(id));
	const onPromote = (id: string) => highlightRepository.promote(id); // row + outbox

	return {
		highlights,
		isEmpty: highlights.length === 0,
		selectedId,
		onSelect,
		onPromote,
	};
}
```

The hook returns **only what the JSX consumes** — a flat object of primitives and callbacks, never a raw
store or a raw Dexie handle.

---

## 7. Naming conventions

Reference table, unchanged, plus:

| Thing                   | Convention                     | Example                            |
| ----------------------- | ------------------------------ | ---------------------------------- |
| Painter file            | `<name>.painter.ts`            | `highlight-layer.painter.ts`       |
| Painter factory export  | `create<Name>Painter`          | `createStrokePainter`              |
| Live-query hook         | `use-<subject>-for-<scope>.ts` | `use-highlights-for-page.ts`       |
| Repository file         | `<subject>-repository.ts`      | `highlight-repository.ts`          |
| Repository export       | `<subject>Repository` object   | `highlightRepository.promote(id)`  |
| Outbox op kind          | lowercase verb                 | `"insert" \| "update" \| "delete"` |
| Command API folder      | `<subject>-api`                | `result-api/`                      |
| Canvas leaf story title | `Canvas/<Name>`                | `'Canvas/HighlightLayer'`          |

---

## 8. Placement decision tree

Run top-down. Stop at the first match.

```
Is it a route?                                              → src/app/<route>/page.tsx
Is it one of the 4 command endpoints?                       → src/app/api/v1/<...>/route.ts
│
Does it WRITE a domain row?
├── local write (user action)                               → features/entities/repository/<x>-repository.ts
├── remote change arriving                                  → features/entities/repository/apply-remote.ts
└── a model call with no local equivalent                   → features/<ctx>/api/<x>-api/   (blueprint command)
│
Does it READ domain rows?
└── always                                                  → features/entities/queries/use-<subject>-for-<scope>.ts
     (useLiveQuery lives here and nowhere else)
│
Does it touch Redux or call a command hook?
├── Yes → does it belong to exactly one context?
│         ├── Yes → features/<context>/components/<name>/
│         └── No  → it is mis-scoped; split it, or the context boundary is wrong
└── No  → does it render on a Konva Stage?
          ├── Yes → shared/components/canvas/<name>/
          └── No  → is it a shadcn primitive?
                    ├── Yes → shared/components/ui/      (npx shadcn add)
                    └── No  → shared/components/template/<name>/
│
Is it imperative Konva (refs, rAF, batchDraw)?              → <leaf>/<leaf>.painter.ts   ONLY
│
Is it a type?
├── mirrors a DB table                                      → shared/types/domain/<table>.ts
├── a local row (domain type + _dirty)                      → features/entities/types/rows.ts
├── slice state / unions                                    → features/<ctx>/types/redux.ts
└── props for one component                                 → <component>/types.ts
│
Is it a function?
├── pure, no React, no domain                               → shared/utils/
├── pure, context-specific                                  → features/<ctx>/utils/
└── wraps a third-party library                             → shared/lib/<library>.ts
│
Does it talk to Supabase?
├── auth or client construction                             → shared/lib/supabase.ts
├── realtime channel                                        → features/sync/realtime/channel.ts
└── anything else                                           → you are bypassing the outbox. Stop.
```

---

## 9. Import direction law

```
app  ──────────▶  features  ──────────▶  shared

features ──▶ features:   ONLY @feature/entities and @feature/sync
sync     ──▶ entities:   allowed
entities ──▶ features:   FORBIDDEN (it imports nothing from any context)
shared   ──▶ features:   FORBIDDEN, except shared/config/redux/store.ts
shared   ──▶ app:        FORBIDDEN
canvas   ──▶ features:   FORBIDDEN (it is presentational, like template/)
painter  ──▶ anything stateful: FORBIDDEN (no store, no Dexie, no feature)
```

```js
// eslint.config.mjs
{
  files: ["src/shared/**/*.{ts,tsx}"],
  ignores: ["src/shared/config/redux/store.ts"],
  rules: { "no-restricted-imports": ["error", { patterns: [
    { group: ["@feature/*", "@app/*"], message: "shared/ must not depend on features/ or app/." },
  ]}]},
},
{
  files: ["src/**/*.painter.ts"],
  rules: { "no-restricted-imports": ["error", { patterns: [
    { group: ["@feature/*", "@shared/config/*"], message: "A painter takes data and a layer ref. Nothing else." },
  ]}]},
},
{
  files: ["src/shared/components/canvas/**/*.{ts,tsx}"],
  rules: { "no-restricted-imports": ["error", { paths: [
    { name: "motion", message: "Konva owns animation on the canvas. motion animates DOM only." },
  ]}]},
}
```

The reference's two documented exceptions still apply and are still debt, not precedent: `store.ts`
importing every slice, and any header/guard component that reaches into a feature. In this project
`app-header` and `auth-guard` live under `features/workspace/components/` from day one, so exception 2
does not get created.

---

## 10. Testing & Storybook colocation

- Unit tests sit next to their subject. Vitest `include` is `src/**/*.test.ts(x)`.
- Three environments: **jsdom** for slices, hooks and DOM components; **`fake-indexeddb`** for repository
  and sync tests; **headless Chromium via Playwright** for story-driven tests, including canvas leaves.
- Story fixtures live in `__mocks__/` inside the component folder — stroke fixtures for canvas leaves,
  row fixtures for containers.
- Feature stories build a throwaway store with `configureStore({ reducer: { workspace, canvas }, preloadedState })`
  and seed Dexie through `db.highlights.bulkPut(fixture)` in a `beforeEach`. Never `makeStore()`, never the
  real persistor.
- Canvas leaf stories must include: `Default`, `Empty`, `ManyStrokes` (≥200 points, the perf case) and
  `DarkTheme` — Konva does not inherit CSS variables, so the theme handoff needs a visual check.

---

## 11. Known hazards specific to this project

Not deviations to copy — hazards to design against. Each has a detection.

| #   | Hazard                                                   | Correct behaviour                                                   | Detection                     |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------- |
| 1   | A container calls `supabase.from(...)` directly          | all writes go through the repository                                | I21                           |
| 2   | `useLiveQuery` inline in a container                     | call a named hook from `queries/`                                   | I23                           |
| 3   | `batchDraw()` in a `.tsx`                                | move to the painter                                                 | I17                           |
| 4   | Peer cursors stored in `useState`                        | refs + imperative paint                                             | I13                           |
| 5   | Highlight rects stored in viewport pixels                | normalize at capture                                                | I19 + a zoom-then-reload test |
| 6   | `entities` added to the persist whitelist "for offline"  | Dexie _is_ the offline store                                        | I12                           |
| 7   | A Konva `Stage` mounted for every page of a 200-page PDF | window ±1 page, unmount the rest                                    | review gate                   |
| 8   | `motion` animating a Konva node                          | Konva tween, or animate the DOM wrapper                             | I20                           |
| 9   | Service worker debugged in dev                           | Serwist is disabled in dev under Turbopack — use a production build | —                             |
| 10  | A fifth API endpoint added "temporarily"                 | blueprint entry or no file                                          | I15                           |

---

## 12. Structural invariants

An agent that generated this project correctly can assert all of the following. I1–I10 are the
reference's, unchanged.

**Inherited**

1. Every folder under `shared/components/{template,canvas}/` and `features/*/components/` contains an `index.ts`.
2. Every `*.tsx` with a sibling `use-*.ts` contains no `useState|useEffect|useAppSelector|useAppDispatch|useQuery|useMutation|useLiveQuery`.
3. No file under `src/shared/` imports `@feature/*` or `@app/*`, except `src/shared/config/redux/store.ts`.
4. No file under `src/app/` contains `useAppSelector` or `useAppDispatch`.
5. Every `createApi` declares a unique `reducerPath` present in **both** `rootReducer` and `.concat(...)`.
6. _(replaced — see 13 below)_
7. Every alias in `tsconfig.json` exists in `vitest.config.mts`.
8. No import path contains a duplicated segment outside the leaf's own folder.
9. Every type in `shared/types/domain/` uses branded primitives from `./common` for ids and timestamps.
10. Every slice's state type lives in `features/<ctx>/types/redux.ts`, not inline in the slice file.

**Added for ThinkBoard Lite** 11. No domain row type appears inside a slice's state type. 12. `persistConfig.whitelist` contains no `reducerPath` and does not contain `entities`. 13. Every Dexie table in `db.version(n).stores({...})` has at least one query hook in `queries/`. 14. No container destructures `data` from a command hook. 15. Every `createApi` endpoint traces to a `blueprint.commands[]` entry. 16. Every persisted slice has a `ui` key, and `stripUi` is registered in `persistConfig.transforms`. 17. `batchDraw|new Konva\.|getLayer\(\)` appears only in `*.painter.ts`. 18. No `*.painter.ts` imports `@feature/*` or `@shared/config/*`. 19. No painter returns a value derived from `clientX|clientY|offsetX|offsetY` without passing through `shared/utils/geometry`. 20. No file under `shared/components/canvas/` imports `motion`. 21. `@supabase/supabase-js` is imported only in `shared/lib/supabase.ts` and `features/sync/realtime/channel.ts`. 22. `setAuth()` precedes every `subscribe()` in `channel.ts`. 23. `useLiveQuery` is imported only inside `features/entities/queries/`. 24. Every file under `shared/components/canvas/` begins with `"use client"`. 25. Every `blueprint.canvasLeaves[].hasPainter: true` has a matching `*.painter.ts`, and every `*.painter.ts` traces to a blueprint entry.

> Extend `scripts/verify-architecture.mjs` with 11–25 before generating any feature code.
> **A rule that is not in the script is not a rule** — it is a preference the next agent will silently violate.
