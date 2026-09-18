# frontend-thinkboard-lite

The ThinkBoard Lite web app: a shared PDF workspace where every highlight is a focus point, every focus
point carries notes — typed, or handwritten with a stylus — and the workspace produces a private and a
group conclusion. Tablet-first, collaborative by default, and still working with the network off.

**Local-first.** Every read comes from IndexedDB (Dexie). Every write lands locally with an outbox entry in
one transaction, then syncs to Supabase — PostgREST under RLS for writes, Realtime broadcast for changes
back. The server is four Next.js route handlers under the user's JWT; there is no other backend.

The plan lives one level up, in the architecture repo (`../`), which is also the only git repo.

## Status — 2026-09-18

Scaffold only: `create-next-app` (Next 16.3.4, React 19.2.8, TypeScript strict) + shadcn (`radix-nova`,
Tailwind v4). No product code yet, and **not yet in the target structure** — task 004 moves it. Task 000
(architecture contract: blueprint, `AGENTS.md`, verify script, lint rules) comes first.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000. No environment variables are needed yet. Supabase arrives with tasks
003 and 008 — the client takes the **publishable** key (`sb_publishable_…`), never a secret key (RULE-01).

| Script | Does |
|---|---|
| `dev` / `build` / `start` | Next.js |
| `lint` | ESLint (`eslint-config-next`) |
| `typecheck` | `tsc --noEmit` |
| `format` | Prettier over `**/*.{ts,tsx}` |
| *task 004 adds* | `test` (Vitest), `verify:arch`, `verify` — `npm run verify` green closes every task |

## Target structure

After task 004 — normative source `../04-frontend-folder-architecture.md`:

```
src/
├── app/            routes + the four api/v1 command handlers — composition only
├── features/       bounded contexts
│   ├── entities/   KERNEL A — Dexie: db/, repository/ (writes), queries/ (reads)
│   ├── sync/       KERNEL B — outbox push, realtime pull, reconcile
│   └── workspace/ document/ highlight/ notes/ result/ presence/
├── shared/         components/{ui,template,canvas}, lib/, config/redux/, providers/, hooks/, types/, utils/
└── server/         pipeline/ llm/ memory/ db/ — named after the future Go packages
architecture.blueprint.json   scripts/verify-architecture.mjs   eslint.architecture.mjs   (task 000)
```

Aliases: `@app/*`, `@feature/*`, `@shared/*`, `@public/*` — in `tsconfig.json` **and** `vitest.config.mts`.

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Redux Toolkit + RTK Query (the four commands only) ·
redux-persist · Dexie + `dexie-react-hooks` · OPFS · `@supabase/supabase-js` · shadcn/ui + Tailwind v4 ·
`motion` (DOM only) · `konva` + `react-konva` · `pdfjs-dist` · `tesseract.js` · `mermaid` · `fflate` ·
`@serwist/next` · Vitest + `fake-indexeddb` + Storybook + Playwright.

## Frontend tasks

From `../06-whole-apps-task.md`; each has its plan doc `../todo-task-NNN-<slug>.md`. Plan id = folder id.

| Plan id | Task | Gate, in short |
|---|---|---|
| 000 | architecture contract (5 packages) | verify fixtures catch every planted violation |
| 004 | conform the scaffold to the folder law | `npm run verify` green on the real tree |
| 005 | design system, theme, provider tree | boots light + dark; no hex under `shared/components` |
| 006 | entities kernel — Dexie, repository, queries | row + outbox atomic under `fake-indexeddb` |
| 007 | sync kernel — outbox, realtime, reconcile | two browsers; offline writes land exactly once |
| 008 | auth + workspace shell | sign in → create workspace → shell, against real RLS |
| 009 | PDF canvas | 30 pages at 60 fps on the pilot tablet |
| 010 | text highlight | highlight, zoom, rotate, reload — still correct |
| 011 | region highlight + OCR | scanned page → usable highlight |
| 012 | notes + handwriting (plain `<textarea>`) | three users write real Indonesian with a stylus |
| 013 | sheets + promotion | private invisible to a teammate until promoted |
| 014 | result UI against a stub | full result flow with the server stubbed |
| 015 | realtime presence | 5 peers at 20 Hz, no dropped frames |
| 016 | offline + export bundle | airplane mode round trip; re-import, no duplicates |
| 021 | leader import of an annotated PDF | Acrobat highlights import with zero OCR calls |
| 022 | responsive, motion, theme | a full session on the tablet, no mouse |
| 024 | ink fallback — **only if 012's device test fails** | ink survives offline → reconnect → transcription |

## Docs

`../README.md` (doc map) · `../01-thinkboard-lite-spec.md` (spec) · `../06-whole-apps-task.md` (tasks) ·
`../02-database-architecture.md` (schema, Dexie mirror) · `../04-frontend-folder-architecture.md` (structure) ·
`../03-frontend-architecture.md` (mechanism) · `../05-frontend-sync-handwriting.md` (sync, handwriting) ·
`../todo-task-000-split.md` (task 000, invariants I1–I29, decision registry).
