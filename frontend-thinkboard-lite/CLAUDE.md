@AGENTS.md

# CLAUDE.md — frontend-thinkboard-lite

The ThinkBoard Lite web app. Plan docs live one level up (`../`); git runs from that root repo only. Human
overview: `README.md`.

## Before touching code

1. `../README.md` — the main gate: how an agent thinks and works, `agent-thinking` → `agent-history`,
   git limits. It applies here unchanged.
2. Your task's plan doc, `../todo-task-NNN-<slug>.md`. No code before its `task.json` + completed `analyze.json`.
3. Next 16 is newer than your training data: check `node_modules/next/dist/docs/` for any API you use.

## The tree today vs. the law

**Done (task 004):** the create-next-app + shadcn scaffold now lives under `src/{app,features,shared}`, with the
aliases `@app/* @feature/* @shared/* @public/*` declared in `tsconfig.json` **and** `vitest.config.mts`
(`../04-frontend-folder-architecture.md` §2). `src/server/` is not created until a task gives it a real member.
**Law:** that tree is the law; nothing else moves files between layers.

`npm run verify` runs `verify:arch` (task 000's `architecture.blueprint.json`, `scripts/verify-architecture.mjs` and
`eslint.architecture.mjs`), lint, typecheck and the tests. It must be green before a frontend task closes.

Where a file goes, where state lives, leaf shapes, the store edit and the escalation procedure are all in
`AGENTS.md` (imported above) — read it, not a copy of it.

## Never

- `@supabase/supabase-js` outside `shared/lib/supabase.ts` and `features/sync/realtime/channel.ts` (I21)
- `useLiveQuery` outside `features/entities/queries/` (I23); `dexie` outside `db/`, `repository/`, `queries/` (I29)
- a domain row in a slice (I11); `entities` or a `reducerPath` in the persist whitelist (I12)
- `data` destructured from a command hook (I14); a fifth endpoint or a CRUD-shaped `createApi` (I15)
- `batchDraw`, `new Konva.*`, `getLayer()` outside `*.painter.ts` (I17); `motion` under `components/canvas/` (I20)
- viewport pixels leaving a painter — normalize through `shared/utils/geometry` (I19, RULE-17)
- a rich-text editor or `contenteditable` for notes (I26); anything interactive over the note textarea + 16 px (I27); an LLM call on the note-save path (I28)
- Zustand or TanStack Query (conflict C8); any secret or service-role key (RULE-01)
- containers before the sync kernel exists — the single most likely agent failure (`../03-frontend-architecture.md` §12)

All 29 invariants, with how each is enforced: `../todo-task-000-split.md` §4.

## Repo conventions

- Prettier: no semicolons, double quotes, 2 spaces, `trailingComma: es5`, Tailwind class sorting — `npm run format`.
- shadcn style `radix-nova`; `cn()` comes from the `cn` package (shadcn's `clsx` + `tailwind-merge`
  replacement). After any `shadcn add`, check nothing domain-flavoured landed in the components alias.
- Commands: `npm run dev | build | lint | typecheck | format | test | test:scripts | verify:arch | verify | storybook | build-storybook`.
  `build` is `next build --webpack`: Serwist is a webpack plugin, so it is disabled in dev (Turbopack) and only a
  production build generates and registers the service worker.
- `npm run test` runs Vitest in two projects: `unit` (jsdom, and `fake-indexeddb/auto` where a test needs IndexedDB) and
  `stories` (every Storybook story, in headless Chrome through Playwright).
- `scripts/` is plain Node ESM with no dependencies; its tests run with `node --test "scripts/*.test.mjs"`.

## Git

Git is run from the architecture repo root only; same rules as `../09-agent-limitation.md`: every git write needs an explicit yes, every time,
and lands on the shadow branch — never on `master`.
