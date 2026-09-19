<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — frontend-thinkboard-lite

The cold-start brief for this app. **This file plus [`architecture.blueprint.json`](architecture.blueprint.json) is
enough to place any file** — which folder, which kind of leaf, which command, which Dexie table. If they are not
enough, that is a gap in the contract: follow §6, never guess.

Before any code, the main gate in [`../README.md`](../README.md) applies: your task's plan doc, `task.json`, a
completed `analyze.json`. The blocks marked *verbatim* are copied from the architecture docs and checked by
`node --test "scripts/*.test.mjs"`; edit them at the source, never here.

---

## 1. Import direction — verbatim from `04-frontend-folder-architecture.md` §9

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

Enforced by [`eslint.architecture.mjs`](eslint.architecture.mjs) (I3, I18, I20, I21, I23, I26, I29).

---

## 2. Placement decision tree — verbatim from `04-frontend-folder-architecture.md` §8

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

## 3. A bounded context's folders — verbatim from `04-frontend-folder-architecture.md` §4.3

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

The eight contexts, and which two are kernels, are `contexts[]` in the blueprint. Create a subfolder only
when it has a real member — never an empty placeholder.

---

## 4. The three leaf kinds — from `04-frontend-folder-architecture.md` §6

| Kind               | Where                                | Files                                                                                                                       | Hook does                                                           |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Template leaf**  | `shared/components/template/<name>/` | `.tsx`, `use-*.ts`, `types.ts`, `index.ts`, `*.test.tsx`, `*.stories.tsx`, optional `-skeleton.tsx`, optional `.module.css` | **derivation only** — no dispatch, no fetch, no router              |
| **Canvas leaf**    | `shared/components/canvas/<name>/`   | as above **+ `*.painter.ts`**                                                                                               | derivation + painter lifecycle                                      |
| **Container leaf** | `features/<ctx>/components/<name>/`  | `.tsx`, `use-*.ts`, `types.ts`, `index.ts`, `*.test.tsx`, `*.stories.tsx`                                                   | **orchestration** — dispatch, query hooks, repository calls, router |

- **The barrel is the contract.** Import `@shared/components/canvas/highlight-layer`, never
  `…/highlight-layer/highlight-layer` (I8).
- **A painter is never exported from its barrel**, imports no store, no Dexie and no feature (I18), and is the
  only file allowed `batchDraw()`, `new Konva.*` or `getLayer()` (I17). Its coordinates leave normalized 0–1 (I19).
- A canvas leaf with a painter must be listed in `canvasLeaves[]` with `hasPainter: true` (I25).

---

## 5. Where state lives, and the 4-point store edit

| State | Home | Read via |
|---|---|---|
| domain rows | Dexie — `features/entities` (`localFirst.tables` in the blueprint) | named hooks in `entities/queries/`; writes via `entities/repository/` |
| PDF bytes | OPFS — `shared/lib/opfs.ts` | `useArtifactFile()` |
| session + durable UI | Redux slices — **ids and phase, never a row** (I11) | `useAppSelector` |
| 60 fps transient (ink, cursors, pinch) | `useRef` + a `*.painter.ts` | never through React |

A new slice, API or listener touches `src/shared/config/redux/store.ts` at exactly these four points — verbatim
from `03-frontend-architecture.md` §5.3:

```ts
// 1. rootReducer          slice or api reducer
// 2. persistConfig        slices only
// 3. .concat()            api middleware
// 4. .prepend()           listenerMiddleware.middleware   ← once, and every listener registered to it
```

The persist whitelist holds slices only — never `entities`, never a `reducerPath` (I12) — and every persisted
slice keeps throwaway state under `ui`, stripped by `stripUi` (I16). A command (`commands[]`, four of them, no
fifth — I15) returns an id or a status, never a row (I14).

---

## 6. When two sources disagree — the escalation procedure

"Ask, don't invent", as steps:

1. **Stop.** Write nothing that depends on the answer.
2. **Record it** in three places, with both sources cited as doc + §:
   `openQuestions[]` in `architecture.blueprint.json` (next free id, `state: "unanswered"`, `blocks`),
   the registry in `../todo-task-000-split.md` §4.1, and your task's `analyze.json.open_questions`.
3. **Ask the human.** Only their answer makes a row `confirmed`. A default a doc author took stays `defaulted`.
4. **Never pick** — not even when the precedence table (`../todo-task-000-split.md` §3.0) seems to settle it and
   the winner looks wrong. That is exactly the case to escalate (conflict C6).

---

## 7. What no script checks — the review checklist

| Invariant | What to check | Owner until a test covers it | Covered by |
|---|---|---|---|
| I19 | every coordinate leaving a painter or its hook passes through `shared/utils/geometry` — no `clientX`/`offsetX` in a return value | the reviewer of any change to a `*.painter.ts` or its `use-*.ts` | task 009 `g5` geometry tests, task 010 `g5` zoom-then-reload test |
| I27 | nothing with `pointer-events: auto` overlaps the note textarea + 16 px; the Konva Stage is `pointer-events: none` while the note sheet is open | the reviewer of any change under `features/notes/**` or `shared/components/canvas/**` | task 012 `g7`, a named Playwright story test |
| I28 (runtime half) | no model call is awaited in a note-save handler; transcription is an outbox op, never inline | the reviewer of any change under `features/notes/**` | task 012 `g5` autosave test; task 024 `g3` `transcribe` op |

---

## 8. Checks you can run

```bash
node scripts/verify-architecture.mjs
```

```bash
node scripts/verify-architecture.mjs --fixtures
```

```bash
node --test "scripts/*.test.mjs"
```

The first prints all 29 invariants and exits 1 on any failure; with no `src/` it fails by design. Task 004 wired
these as `npm run verify:arch` and `npm run verify`.
