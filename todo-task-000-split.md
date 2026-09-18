---
doc_id: thinkboard-lite-task-000-split
title: Task 000 Split — the Architecture Contract, as five packages
version: "1.1"
status: proposed
updated: 2026-09-18
task: "000"
extends: ["06-whole-apps-task.md", "07-agent-working.md", "08-agent-todo-intake.md"]
companion: ["02-database-architecture.md", "04-frontend-folder-architecture.md"]
authority: "Process + scope for task 000 only. Product intent stays in 01-thinkboard-lite-spec.md. Process law stays in 07-agent-working.md."
---

# Task 000 — Split: the architecture contract as five packages

`000-task-architecture-contract` blocks every other task, and as written it is the one task whose
gate cannot fail. This file splits it into five ordered packages inside **one** task folder, replaces
its gate with one a stub cannot pass, and records the nine places the plan docs disagree with each
other — or with the repository — about a fact the blueprint must state exactly once, plus one gap.

> **rev 1.1 (2026-09-18) — finished.** Adds the source-precedence table (§3.0), conflicts C7–C9 and gap
> G1 (§3), the decision registry (§4.1), sync defects F7–F8 (§5.3), and the database review that now
> lives in `02-database-architecture.md` §11. Package A's inputs are therefore complete. What remains for
> A is transcription into `analyze.json` plus **human sign-off on C6**. C7 was resolved by the owner the
> same day (plan id = folder id).

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §2 packages and gates, §3.0 precedence, §3 conflict verdicts, §4 + §4.1 registries, §7 contract scaffolding. Implement exactly. |
| **Explanatory** | §1, §5. Context for *why*; not requirements. |
| **On conflict** | `07-agent-working.md` still wins on process. `01-thinkboard-lite-spec.md` still wins on Lite product intent. This file wins on **the scope and sequencing of task 000 only**. |
| **Numbering** | `NNN` stays a global monotonic counter (`07-agent-working.md` §3). Packages A–E are an ordering **inside** `task.json.goals[]` — not new folders, not new task ids. Plan id = folder id for `000`–`024` (C7, resolved 2026-09-18). |
| **Do not** | Resolve a §3 conflict differently without recording it. Add a sixth package. Start package B before A closes. |

---

## 1. Why 000 needs splitting

Five defects, all in the seams.

### D1 — The gate is satisfiable by a no-op

`verify:arch green on an empty tree`. An empty tree violates nothing, so a `verify-architecture.mjs`
containing zero checks exits 0 and the gate goes green. **The gate cannot distinguish a finished
analyzer from a stub.** And the tree it runs against does not exist yet: the repository is created by
`create-next-app` in task 004.

*Update 2026-09-18:* a tree now exists — `frontend-thinkboard-lite/` was scaffolded ahead of the plan —
but it has no `src/` (C9). So the harness must treat a missing `src/` as a **fail**, never as an empty
pass (package D `g11`).

### D2 — g3 is a program, not a config line

"Extend `verify-architecture.mjs` with I11–I29" is a static analyzer that parses `store.ts`,
`tsconfig.json`, `vitest.config.mts`, a Dexie `stores({…})` call and `architecture.blueprint.json`.
It is larger than g1, g2, g4 and g5 combined, and every later task's `npm run verify` depends on it.

### D3 — Nine of those nineteen rules do not belong in the script

Six are ESLint rules. Two are human review gates — **I19** (painter coordinates pass through
`shared/utils/geometry`) is already called a review gate in `03-frontend-architecture.md` §10. And
**I27** (nothing with `pointer-events:auto` overlaps the note textarea + 16px) is a runtime layout
property no grep can see. Folded into "extend the script", they become rules that pass forever
without being checked — the exact failure `04-frontend-folder-architecture.md` §12 names:
*a rule that is not in the script is not a rule.*

### D4 — The blueprint must be written from docs that disagree

Nine facts the blueprint states once have two values across the plan docs or the repository (§3). g1
says write the blueprint; it does not say who decides. An agent will resolve them by inference, which is precisely
what task 000 exists to make impossible.

### D5 — 000 and 004 both claim the same two files

000 writes `eslint.config.mjs` and needs an npm script called `verify:arch`. Task 004 runs
`create-next-app`, which owns `package.json` and writes its own `eslint.config.mjs`. **As sequenced,
004 silently overwrites 000.**

*Update 2026-09-18:* the order ran the other way — `create-next-app` already ran, so both files exist
before 000 starts. The fix is unchanged: 000 owns neither file (C9, package E `g17`).

---

## 2. The split

One folder — `agent-history/000-task-architecture-contract/` — five packages, 18 goals, one gate each.

```
A Freeze      g1–g3    ≈ ½ day    unblocks 001
B Blueprint   g4–g7    ≈ ½ day    needs A
C AGENTS.md   g8–g10   ≈ ½ day    needs A
D Verify      g11–g15  ≈ 2–3 d    needs A; g13 needs B
E Lint + 004  g16–g18  ≈ ½ day    needs A
```

### Package A — Freeze · `g1–g3`

**Main goal —** settle every fact the blueprint states exactly once, so no later package infers one.
**This is the package that actually unblocks task 001**, which needs the decision registry and
nothing else.

- `g1` Source-precedence table (§3.0), then resolve conflicts C1–C9 and gap G1 in §3. One winner per
  row, each with a `doc` + `§` citation. Anything precedence cannot settle is escalated to the human,
  never picked.
- `g2` The canonical invariant registry — all 29 (§4), each with an enforcement class.
  `04-frontend-folder-architecture.md` §12 carries only I1–I25; **I26–I29 live in two other files** and
  I6 is void.
- `g3` The canonical decision registry — `D-01…D-12`, `Q1…Q11`, `DB-Q1…DB-Q12` (35 entries, §4.1), each
  with `state ∈ defaulted | unanswered | confirmed` and `blocks: [taskId]`.

**Gate —** every conflict row carries a winner and a citation, or an escalation with a named human; the
registries total 29 invariants (I6 void) and 35 decisions; no entry reads "TBD". A default taken by a doc
author is recorded as `defaulted`, **never** as `confirmed`. Only a human's word makes a row `confirmed`.
**Blocks —** B, C, D, E, **001**.

### Package B — Blueprint · `g4–g7`

**Main goal —** emit `architecture.blueprint.json`, and the schema that proves it well-formed,
because three invariants read it and would otherwise pass silently on a typo.

- `g4` `contexts[]` (8, per `04-frontend-folder-architecture.md` §4), `domainTables[]` from
  `02-database-architecture.md` §2, and `localFirst{}` — 7 Dexie tables, the compound
  `[artifactId+page]` index, `idStrategy: "uuidv7-client"`, `blobStore: "opfs"`, **plus the outbox op
  shape and the three-state `_sync` row flag**, copied verbatim from `02-database-architecture.md` §6.1.
- `g5` `commands[]` — 4, each carrying the `baseUrl` it resolves against, so I15 compares like with
  like. `canvasLeaves[]` — 5, each with `hasPainter` **and** `status`. `listeners[]` — the sync
  context's four actions.
- `g6` `openQuestions[]` and `invariants[]`, carried over from A as machine-readable arrays rather
  than prose.
- `g7` `blueprint.schema.json`, plus a self-check that runs **before** any cross-check. A malformed
  blueprint must fail loudly instead of making I13, I15 and I25 vacuously true.

**Gate —** the blueprint validates against its own schema; every `localFirst.tables[]` entry maps to
a row in `02-database-architecture.md` §2; every command maps to a route file in
`01-thinkboard-lite-spec.md` §4.3; every canvas leaf maps to a folder in
`04-frontend-folder-architecture.md` §5.2.
**Blocks —** D `g13`, 004.

### Package C — `AGENTS.md` · `g8–g10`

**Main goal —** the cold-start brief. Its real test is not completeness but that an agent holding
only this file and the blueprint never needs to open a plan doc to place a file.

- `g8` Import-direction law, the placement decision tree **verbatim** from
  `04-frontend-folder-architecture.md` §8 (it is normative — paraphrasing loses rules), and the three
  leaf kinds with their file sets.
- `g9` The 4-point store edit, and the escalation rule: **on finding two docs that disagree, stop and
  add an `openQuestions[]` entry — never pick.** This is "ask, don't invent" stated as a procedure
  rather than a sentiment.
- `g10` The human review checklist for what no script can check — I19, I27, and the runtime half of
  I28 — each naming its owner and the task whose test finally covers it.

**Gate —** a cold agent given only `AGENTS.md` and the blueprint places all ten sample artifacts
correctly with no other file open: a painter, a query hook, a slice, a command API, a domain type, a
canvas leaf, a container, a shadcn atom, a pure util, a route.
**Blocks —** every agent-executed task.

### Package D — `verify-architecture.mjs` · `g11–g15`

**Main goal —** the analyzer, and the fixture suite that is its only honest gate. Roughly two thirds
of task 000 lives here, which is the strongest single argument for splitting at all.

- `g11` Harness: dependency-free Node, walks `src/`, emits `{id, status, file, line, message}`,
  `--json` for CI, exit 1 on any fail. **A missing `src/` is a fail, not an empty pass** (D1, C9).
- `g12` The 15 tree-only checks — I1, I2, I4, I5, I7, I8, I9, I10, I11, I12, I14, I16, I17, I22, I24.
- `g13` The 3 blueprint cross-checks — I13, I15, I25. These read package B's output, the one real
  ordering constraint inside 000. **I25 must skip leaves whose `status` is `conditional` and whose
  gating task closed as not-needed** (§3, C4).
- `g14` **The fixture suite.** One violating tree per script-class invariant plus one clean tree. The
  script must flag each planted violation *under the right id* — a check that fires on the wrong rule
  is a false green somewhere else.
- `g15` Every invariant the script cannot check prints as `skipped` with its reason and owning gate,
  so the report always shows 29 rows and a dropped rule is visible rather than absent.

**Gate —** `node scripts/verify-architecture.mjs --fixtures`: every planted violation caught under its
own id, the clean fixture green, and the report printing all 29 rows. **This replaces "green on an
empty tree", which any stub passes.**
**Blocks —** 004, and every later `npm run verify`.

### Package E — Lint rules and the 004 handoff · `g16–g18`

**Main goal —** the seven rules ESLint enforces better than any script, plus the written agreement
that stops task 004 overwriting them.

- `g16` `eslint.architecture.mjs` exporting a flat-config **array**:
  `shared/**` ↛ `@feature/*|@app/*` (I3, except `store.ts`) ·
  `*.painter.ts` ↛ `@feature/*|@shared/config/*` (I18) ·
  `canvas/**` ↛ `motion` (I20) ·
  `@supabase/supabase-js` in two files only (I21) ·
  `dexie-react-hooks` in `entities/queries` only (I23) ·
  no rich-text library under `features/notes/**` (I26) ·
  `dexie` in three modules only (I29).
- `g17` The handoff, in writing: **000 does not run `create-next-app`** and owns neither
  `package.json` nor `eslint.config.mjs`. Task 004 `g1` becomes "conform the existing scaffold" (C9)
  and gains "spread `eslint.architecture.mjs` into the existing config"; 004 `g4` gains
  "`verify:arch` = `node scripts/verify-architecture.mjs`". Record both in `06-whole-apps-task.md`
  task 004 until 004's own `task.json` exists.
- `g18` "Green on the real tree" moves to 004's gate, where a real tree exists to be green on.

**Gate —** the rule array flags every planted violation in the lint fixture and is clean on the good
one; task 004's `task.json` carries both handoff criteria **before** 000 closes.
**Blocks —** 004.

### The risk this split creates

Package A is executed by an agent, and A's whole job is ten judgement calls — precisely the behaviour
package C is written to forbid. **A resolves only what the precedence table decides; everything else
stops and asks.** Conflict C6 is the worked example: precedence says the schema file wins, and the
schema file is the one that is wrong.

---

## 3. The conflicts

Each is a fact the blueprint states once and the docs state twice. The verdict column is the
recommendation; the reasoning is what package A's `analyze.json` should carry.

### 3.0 Source precedence — package A `g1`

Most specific authority wins; a user decision beats every doc. Top-down, stop at the first row that
covers the fact:

| # | Fact is about… | Winner | Authority |
|---|---|---|---|
| P0 | anything the user has decided in chat | the user's words, recorded as `confirmed` | `09-agent-limitation.md` §3 |
| P1 | process — phases, files, numbering, git | `07-agent-working.md` → `08-agent-todo-intake.md` → `09-agent-limitation.md` | spec §0, whole-apps §0 |
| P2 | scope and sequencing of task 000 | this file | frontmatter `authority` |
| P3 | the task backlog and each task's goals | `06-whole-apps-task.md` | D-05 / DB-Q5, confirmed |
| P4 | Lite schema, RLS, triggers, the Dexie mirror | `02-database-architecture.md` rev 1.1 (§6.1, §8.1) | its `supersedes`; spec §6 carries the pointer |
| P5 | frontend structure — folders, aliases, leaves, invariants | `04-frontend-folder-architecture.md` | "normative", its §0 |
| P6 | frontend mechanism — state library, flows, seams | `03-frontend-architecture.md`, as amended by v2 §3–§4 | v2 `supersedes` fa §6.5 |
| P7 | Lite product intent — what a user can do | `01-thinkboard-lite-spec.md` | spec §0 |
| P8 | Full product intent, Full base schema | `00-thinkboard-abstract-plan.md`, `thinkboard-schema-final.sql` | spec §0 — not in this repo |
| — | `10-abstract-plan-superseded.md`, HTML companions, `claude-artifact/`, `old/` | never a winner | superseded by spec, explanatory, or archived |

When two rows both claim a fact, or the winning row is demonstrably wrong (C6), **stop and escalate**.

### C1 — The Dexie table set: six tables or seven?

| Source | Value |
|---|---|
| `01-thinkboard-lite-spec.md` §5.3, `03-frontend-architecture.md` §11 | meta · artifacts · highlights · notes · miniConclusions · outbox |
| `02-database-architecture.md` §6.1 | the same six **plus `runs`** |

**Verdict: seven.** `04-frontend-folder-architecture.md` §4.1 ships `use-run.ts` in `queries/` while
declaring only six tables — so its own I13 has a hook with nothing to bind to. Task 014 `g2` settles
it: result reads come from Dexie, never from the mutation response.

Precedence alone cannot decide this one — `04-frontend-folder-architecture.md` contradicts *itself*. The
tiebreak is a downstream task's acceptance criterion.

### C2 — The highlights index: flat or compound?

| Source | Value |
|---|---|
| `01-thinkboard-lite-spec.md` §5.3 | `'id, artifactId, page, layer, _dirty'` |
| `02-database-architecture.md` §6.1, `04-frontend-folder-architecture.md` §4.1 | `'id, [artifactId+page], layer, _dirty'` |

**Verdict: compound.** Situation S3 in `05-frontend-sync-handwriting.md` §1.1 argues the entire
case for Dexie on `where('[artifactId+page]')` being an index seek rather than an O(n) filter.
Shipping the flat index keeps the dependency and discards the reason for it.

### C3 — The context list: seven or eight, named how?

| Source | Value |
|---|---|
| `01-thinkboard-lite-spec.md` §4.2 | workspace · pdf-canvas · highlight · notes · result · presence · offline |
| `04-frontend-folder-architecture.md` §4 | entities · sync · workspace · document · highlight · notes · result · presence |

**Verdict: the folder doc wins — eight, `document` not `pdf-canvas`, and no `offline` context at
all.** Offline is `sync.phase` (`03-frontend-architecture.md` §5.1). An `offline/` folder would be a
bounded context with no rows, no slice and no components — an empty box that later work fills by
accident.

### C4 — Canvas leaves: three or five, and what happens to `ink-pad`?

| Source | Value |
|---|---|
| `03-frontend-architecture.md` §11 | highlight-layer · ink-pad · peer-cursors |
| `04-frontend-folder-architecture.md` §5.2 | page-stage · highlight-layer · ink-pad · peer-cursors · marquee |

**Verdict: five — and `ink-pad` needs `status: "conditional"` keyed to task 024.** Task 011 `g1`
requires a marquee painter, so three is stale. The sharper problem: **I25 fails the moment task 012
`g6` succeeds.** If the pilot's tablets do convert Indonesian handwriting, task 024 is deleted,
`ink-pad.painter.ts` is never written, and a blueprint promising `hasPainter: true` makes
`verify:arch` red forever on work that was correctly skipped. One field in the blueprint; an
unfixable red build without it.

### C5 — Command URLs: `/v1/…` or `/api/v1/…`?

| Source | Value |
|---|---|
| `03-frontend-architecture.md` §11 | `"url": "/v1/workspaces"` |
| `01-thinkboard-lite-spec.md` §4.3, `04-frontend-folder-architecture.md` §3.2 | `app/api/v1/workspaces/route.ts` → `/api/v1/workspaces` |

**Verdict: keep `/v1/…` in the blueprint and state the `baseUrl: "/api"` it resolves against, in the
blueprint itself.** Both are right — one is the RTK Query path, the other the filesystem route. Left
implicit, I15 cross-checks two strings that can never match, so the rule either never fires or always
does.

### C6 — `note_input_mode`: two values or three?

| Source | Value |
|---|---|
| `01-thinkboard-lite-spec.md` §6 `create type` | `('keyboard','ink')` |
| `05-frontend-sync-handwriting.md` §5, `02-database-architecture.md` §4 | `('keyboard','ink','stylus_os')` + `transcribed_by` |

**Verdict: three values plus the `transcribed_by` column — and this one does not stay inside task
000.** It is a migration fact. Unless package A hands it to task 001 as an extra criterion on `g2`,
`0004_lite.sql` ships a two-value enum and task 012 has to `alter type … add value` against a live
table, then backfill.

This is the conflict to show a human: `01-thinkboard-lite-spec.md` §0 says the schema file wins on schema
shape, but here the newer frontend doc is correct. **Precedence points at the wrong answer, which is
exactly when an agent should stop.**

*Update 2026-09-18:* already applied in `02-database-architecture.md` §8.1 (DB-F1), and spec §6 now
points there. It still needs a human's yes before task 001 ships it.

### C7 — Task ids: the plan's `001–024` or the next free numbers?

| Source | Value |
|---|---|
| `06-whole-apps-task.md` §0, this file §0 | Lite tasks are `000`–`024`, "global monotonic, never reused" |
| `agent-history/running-process.json` | `001`–`010` are already taken by Full's Go-backend tasks — `006` twice |
| `07-agent-working.md` §3 | numbers are never reused or resequenced |

**Verdict: escalated, then resolved by the owner (P0), 2026-09-18.** The owner cleared `agent-history/`
(001–010, `running-process.json`) and `tracking-todo.json`, which removes the collision instead of remapping
around it: **plan id = folder id, `000`–`024`**. The never-reuse rule of `07-agent-working.md` §3 applies
from this clean start on. (The rejected alternative was plan id + 10.)

### C8 — The state library: Redux Toolkit, or TanStack Query + Zustand?

| Source | Value |
|---|---|
| `01-thinkboard-lite-spec.md` §5.3 | "TanStack Query (queryFn reads Dexie)"; sync status and UI state in **Zustand** |
| `03-frontend-architecture.md` §1, §5.4; ffa §4.4, §5; whole-apps 005 `g3` | Redux Toolkit + redux-persist; RTK Query for the four commands only; "**No Zustand**" |

**Verdict: Redux Toolkit (P6 over P7).** spec §0 gives spec authority over Lite *product intent*; the state
library is frontend mechanism, which fa governs, and task 005 already builds against it — the same basis
as C3. Blueprint consequence: `listeners[]` are RTK listener-middleware effects, and I4, I5, I10–I12, I14
and I16 only make sense under this verdict.

### C9 — The scaffold already exists

| Source | Value |
|---|---|
| this file D5, whole-apps 004 `g1` | 004 runs `create-next-app` after 000 |
| `frontend-thinkboard-lite/` on disk | already scaffolded: Next 16.3.4, React 19.2.8, shadcn `radix-nova`, Tailwind v4, `cn`; its own git repo; **no `src/`**, one alias `@/*`, `components.json` bound to root `components/` and `lib/`, an `AGENTS.md` holding Next's agent-rules block |

**Verdict: the ownership rule stands, and 004 changes shape.** 000 still owns neither `package.json` nor
`eslint.config.mjs`. Task 004 `g1` becomes *conform the scaffold*: move to `src/{app,features,shared}`, set
the four aliases in `tsconfig.json` **and** `vitest.config.mts`, rebind `components.json` to the three
tiers, and move `components/ui` → `src/shared/components/ui` and `lib/utils.ts` → `src/shared/lib`.
Package C must keep the `<!-- BEGIN:nextjs-agent-rules -->` block when it writes `AGENTS.md` — Next's
tooling owns it. (`cn` is shadcn's own drop-in for `clsx` + `tailwind-merge`, so fa §8's `cn()` seam is
unchanged.)

### G1 — Gap: tables the client uses but Dexie does not mirror

Not a conflict — a hole. `02-database-architecture.md` §6 marks `teams`, `team_members`,
`memory_entries` and `llm_*` as "queried live". RULE-07 forbids network reads, I21 limits
`@supabase/supabase-js` to two files, and I15 limits `createApi` to the four commands — so a live read
has no legal file to live in. **Verdict: escalated as DB-Q12**, with a default: the sync engine pulls them
into Dexie `meta`, and their writes go through the outbox. It is a blueprint fact (`localFirst`,
`OutboxOp.table`), so package B waits for it.

### Also frozen in package A — no conflict, just unstated

- The Dexie table is `notes`; the Postgres table is `highlight_notes`. `toWire`/`toRow` is the only
  place the two names meet, and task 006 `g6` asserts that mapper's key set against the column list —
  so both names belong in the blueprint.
- `_sync` (`clean | pending | failed`, replacing the one-bit `_dirty` — F2), `seq` and the outbox op
  `state` are local-only and never cross into a Postgres write. The one definition is
  `02-database-architecture.md` §6.1.
- The database is namespaced per profile — `thinkboard:{profileId}`, deleted on sign-out (DB-Q3).
  Shared tablets are the stated reason. **OPFS is not namespaced this way — see §5.3 F6.**
- Four `localStorage` keys, and exactly four: Supabase session, theme, last workspace id, `mode`.

---

## 4. The invariant registry

The list exists nowhere in one piece today. `04-frontend-folder-architecture.md` §12 has I1–I25,
`05-frontend-sync-handwriting.md` §4 adds I26–I28, and I29 appears only in task 006's gate. I6 was
replaced by I13 and is a hole in the numbering. **An agent implementing "I11–I29" from §12 alone
would build 15 of the 19.**

Class is the *primary* enforcement; I3 and I22 each carry a second, weaker check elsewhere.

| Id | Rule | Enforced by | Specified in | Note |
|---|---|---|---|---|
| I1 | Every component folder has an `index.ts` | script | ffa §12.1 | filesystem walk |
| I2 | No hooks in a `.tsx` with a sibling `use-*.ts` | script | ffa §12.2 | the UI/logic seam |
| I3 | `shared/` never imports `@feature/*` or `@app/*` | eslint | ffa §12.3 | one exception, `store.ts`; script re-asserts |
| I4 | No `useAppSelector`/`useAppDispatch` under `app/` | script | ffa §12.4 | routes compose, never orchestrate |
| I5 | Every `createApi` `reducerPath` is in `rootReducer` and `.concat()` | script | ffa §12.5 | parses `store.ts` |
| ~~I6~~ | *replaced by I13* | void | ffa §12.6 | never reassign this number |
| I7 | `tsconfig` aliases and `vitest.config.mts` aliases match | script | ffa §12.7 | "works in dev, fails in test" |
| I8 | No duplicated path segment in an import | script | ffa §12.8 | catches deep imports past a barrel |
| I9 | Domain types use branded primitives from `./common` | script | ffa §12.9 | AST over `shared/types/domain/` |
| I10 | Slice state types live in `features/<ctx>/types/redux.ts` | script | ffa §12.10 | never inline in the slice file |
| I11 | No domain row type inside a slice's state | script | ffa §12.11 | slices hold ids and phase |
| I12 | `whitelist` holds no `reducerPath` and not `entities` | script | ffa §12.12 | hazard 6 |
| I13 | Every Dexie table has ≥1 query hook | script · blueprint | ffa §12.13 | C1 — currently fails on `runs` |
| I14 | No `data` destructured from a command hook | script | ffa §12.14 | a command returns an id or a status |
| I15 | Every `createApi` endpoint traces to `blueprint.commands[]` | script · blueprint | ffa §12.15 | C5 — needs the `baseUrl` stated |
| I16 | Every persisted slice has a `ui` key; `stripUi` registered | script | ffa §12.16 | fixes reference deviation 8 |
| I17 | Imperative Konva only in `*.painter.ts` | script | ffa §12.17 | `batchDraw` · `new Konva.` · `getLayer()` |
| I18 | A painter imports no `@feature/*` and no `@shared/config/*` | eslint | ffa §12.18 | data and a layer ref, nothing else |
| I19 | Painter coordinates pass through `shared/utils/geometry` | **review** | fa §10 | **not statically decidable** — fa §10 already calls it a review gate |
| I20 | No `motion` import under `components/canvas/` | eslint | ffa §12.20 | Konva runs its own tween loop |
| I21 | `@supabase/supabase-js` in its two seam files only | eslint | ffa §12.21 | a third importer has bypassed the outbox |
| I22 | `setAuth()` precedes every `subscribe()` | script + test | ffa §12.22 | order-in-file grep is weak; pair with fa §6.4's unit test |
| I23 | `useLiveQuery` only inside `entities/queries/` | eslint | ffa §12.23 | containers call a named hook |
| I24 | Every canvas file begins `"use client"` | script | ffa §12.24 | react-konva touches `window` at import |
| I25 | `canvasLeaves[].hasPainter` ↔ a real `*.painter.ts` | script · blueprint | ffa §12.25 | C4 — must skip `conditional` leaves |
| I26 | Note input is a textarea/input; no rich-text library in `features/notes/**` | eslint | v2 §4 | **not in ffa §12** |
| I27 | Nothing with `pointer-events:auto` overlaps the textarea + 16px | **deferred → 012** | v2 §4 | **runtime layout** — becomes a named Playwright story test |
| I28 | No LLM call on the default note path | script + review | v2 §4 | the import is greppable; "never awaited in a save handler" is not |
| I29 | `dexie` imported only in `db/`, `repository/`, `queries/` | eslint | whole-apps 006 gate | **appears only in a task gate** |

**Totals —** script 18 · eslint 7 · review 2 · deferred 1 · void 1 = **29**.
Within g3's stated range I11–I29: **10 script checks, 6 ESLint rules, 2 review gates, 1 browser test.**

### 4.1 The decision registry — package A `g3`

Every open choice across the plan docs, in one place. `blocks` uses task ids, which equal folder ids (C7). Three pairs
are one question asked twice (D-01/DB-Q1, D-02/DB-Q2, D-05/DB-Q5); each id is still its own row, so
duplicates cannot drift apart unnoticed.

| Id | Question | Source | State | Default / answer | Blocks |
|---|---|---|---|---|---|
| D-01 | Is "individual" a privacy boundary? | spec §10 | defaulted | yes | 001, 002 |
| D-02 | One PDF per workspace? | spec §10 | defaulted | one `main` + the leader's `note` copy | 003, 021 |
| D-03 | Who runs the Group Result? | spec §10 | defaulted | leader only — enforced in RLS by db §8.1 | 017, 020 |
| D-04 | One active persona per person? | spec §10 | defaulted | yes | 001 |
| D-05 | Does the Lite backlog replace `07-agent-working.md` §8? | spec §10 | **confirmed** | yes — `06-whole-apps-task.md` is the backlog (user, 2026-09-18) | — |
| D-06 | Can the leader edit generated minutes in place? | spec §10 | defaulted | yes, as a draft | 013 |
| D-07 | How does a member's thinking reach the Group Result? | spec §10 | defaulted | explicit promotion via `shared_at` | 001, 013 |
| D-08 | Can the leader hide or delete a promoted note? | spec §10 | defaulted | neither in v1 | 013 |
| D-09 | Does leadership transfer? | spec §10 | defaulted | yes, by the leader or the creator | 008 |
| D-10 | Is the group document cached offline? | spec §10 | defaulted | no | 016 |
| D-11 | Device parity | spec §10 | defaulted | tablet authors, desktop analyses, mobile reads and writes notes; no ink on mobile | 022 |
| D-12 | Free-tier provider vs. document sensitivity | spec §10, whole-apps §3 | **unanswered** | — | 018 |
| Q1 | Dexie, or `createEntityAdapter` + persist? | fa §13 | defaulted | Dexie (reasons: §5.1) | 006 |
| Q2 | RTK Query scope | fa §13 | defaulted | the four commands only | 014, 017 |
| Q3 | Sync as listener middleware or a provider? | fa §13 | defaulted | listener middleware | 007 |
| Q4 | Canvas leaves as a third shared tier? | fa §13 | defaulted | third tier | 000, 009 |
| Q5 | Storybook for canvas leaves? | fa §13 | defaulted | yes, with fixture strokes | 004, 011 |
| Q6 | Mobile at the end? | fa §13 | defaulted | breakpoint hook + sheet early, layout last | 005, 022 |
| Q7 | Does Scribble produce usable Bahasa Indonesia on the fleet? | v2 §6 | **unanswered** | 45-minute test — run before 000 closes | 012, 024, blueprint `ink-pad.status` |
| Q8 | The real tablet mix | v2 §6 | **unanswered** | — | 012, 022 |
| Q9 | Do users have styluses at all? | v2 §6 | **unanswered** | assume a pen; verify | 012 |
| Q10 | Hand-rolled sync, or PowerSync from day one? | v2 §6 | defaulted | hand-rolled; escape hatch keyed to behaviour (§5.1) | 007 |
| Q11 | Note sheet docked or overlaid? | v2 §6 | defaulted | dock ≥1280, overlay below (I27) | 012, 013 |
| DB-Q1 | = D-01 | db §10 | defaulted | yes | 001, 002 |
| DB-Q2 | = D-02 | db §10 | defaulted | `main` + `note` | 003 |
| DB-Q3 | Per-profile Dexie namespace? | db §10 | defaulted | yes — and OPFS is wiped with it (F6) | 006, 016 |
| DB-Q4 | Keep `messages`, `context_warnings`, `sources` parked? | db §10 | defaulted | keep parked | 001 |
| DB-Q5 | = D-05 | db §10 | **confirmed** | as D-05 | — |
| DB-Q6 | `create_workspace` RPC — referenced, never defined | db §10 | defaulted | definer RPC in `0004`; creator is leader; other leader = transfer | 001, 008, 017 |
| DB-Q7 | May a member write a group-visibility note directly? | db §10 | defaulted | allowed as written; kept off `ws:` unless the highlight is public | 002, 013 |
| DB-Q8 | `mini_conclusions` writable by any member on shared highlights | db §10 | defaulted | as written; tighten after DB-Q7 | 019 |
| DB-Q9 | Topic for client-sent cursors and presence | db §10 | defaulted | separate `live:{sessionId}` topic | 015 |
| DB-Q10 | Is `memory_entries` group scope leader-only in `0001`? | db §10 | defaulted | verify; add a restrictive policy if not | 001, 002 |
| DB-Q11 | Storage path and policy for PDFs | db §10 | defaulted | `artifacts/{sessionId}/{artifactId}.pdf` | 003 |
| DB-Q12 | Read/write path for non-mirrored tables (G1) | db §10 | defaulted | pull into Dexie `meta`; write through the outbox | 000, 006, 007, 008 |

**Totals —** 35 · unanswered **4** (D-12, Q7, Q8, Q9) · confirmed 2 (D-05, DB-Q5) · defaulted 29.
spec §10 requires D-01, D-05, D-07 and D-12 in task 000's and 001's `analyze.json.open_questions`.

---

## 5. The Dexie challenge

Package A must record this, because it is the decision every later frontend task inherits.

### 5.1 Verdict — keep Dexie, but the stated reason is the weakest one

`05-frontend-sync-handwriting.md` §1 rests the decision on S4: a row and its outbox entry must land
atomically, and Redux has no transaction primitive. That is true, and it is a rigged comparison —
nobody would build offline-first on `redux-persist`. The real alternatives are raw IndexedDB (Dexie
*is* that, typed), a sync engine, or **SQLite-wasm over OPFS**, which §2.7 never considers because it
only evaluates SQLite bundled inside PowerSync.

Evaluated directly, SQLite-wasm loses on three counts that matter more than atomicity:

| | Dexie | SQLite-wasm + OPFS |
|---|---|---|
| Reactivity | `useLiveQuery` — the whole "one rendering path" property of `03-frontend-architecture.md` §4.2 | no change notification; invalidation is hand-rolled |
| Two tabs open | native, `BroadcastChannel`-backed | the `opfs-sahpool` VFS takes an exclusive lock; the second tab fails |
| Bundle | ~30 kB | ~1 MB wasm before any app code, on a field connection |
| Joins | 3 queries + assembly in JS | one statement |

Only the last row favours SQLite, and at 180 highlights and 240 notes it is not felt. **Dexie is the
right call — but if someone later attacks S4 the decision looks shaky, so record the real reasons.**

The escape hatch also needs rewording. §2.7 says adopt PowerSync when hand-rolled sync passes
**~500 lines**, and §1.3 estimates ~300. Counting what §2 actually specifies — paginated bootstrap,
ordered push with coalescing and backoff and parking, two-topic realtime with re-auth, `applyRemote`
with its dirty guard, manifest reconcile with delete detection, the blob channel, and the seven-case
failure matrix — the honest number with tests is **800–1200 lines**. By its own trigger the plan
should already be on PowerSync. Fix the trigger, not the decision: **key the escape hatch to
behaviour — co-editable notes, or a sync bug that loses a note — not to a line count that week one
blows through.**

PowerSync remains the right named escape hatch: it is actively maintained and still ships a
first-class Supabase integration. ElectricSQL is out, and for the reason the plan already suspected —
Electric was acquired by Databricks in August 2026 and folded toward agentic Postgres and Neon.

### 5.2 Collaboration's impact on Supabase — the shape is favourable

Per member, per workspace: **one WebSocket, two topic subscriptions, and no reads.**

Local-first inverts the usual load profile. Reads never reach Postgres — `RULE-07` puts the network
off the read path entirely, so the only reads are the one-time paginated bootstrap and the reconcile
manifest (`select id, updated_at`, a few kB). What collaboration *adds* is on the write side:

| Traffic | Per event | At pilot scale (6 members, 200 highlights, 8h) |
|---|---|---|
| Durable write | 1 PostgREST request, RLS-checked | ~600 writes total (notes autosave coalesced at 800 ms) |
| Broadcast trigger | **+1 insert into `realtime.messages`, inside the same transaction** | ~600 extra rows, auto-deleted after 3 days |
| Trigger lookup | 1 indexed select (highlights) or a 2-table join (notes), synchronous, on the hot path | negligible at this size |
| Realtime fanout | 1 message → ≤6 deliveries | trivial against free-tier limits |
| Cursors / presence | Broadcast only, ~20 Hz, throttled | **never touches Postgres** |

**So: every durable write costs two writes, reads drop to near zero, and each client holds one
socket.** That is a good trade and well within a free Supabase project for a six-person pilot. The
load-sanity target in task 023 `g5` is the right one and should pass comfortably.

Two things to watch as it grows, neither urgent:

1. The note broadcast trigger runs `highlights h join artifacts a` **per row change**, inside the
   write transaction. Confirm `can_access_session` and `is_team_member` are declared `STABLE` so the
   planner evaluates them once per statement rather than once per row.
2. `realtime.messages` is WAL traffic. It is a notification channel with a 3-day retention, not a log
   — nothing should ever read it.

### 5.3 Eight defects found in the sync spec while checking this

These do not change the Dexie decision. They change tasks 001, 007, 016 and 021, and package A should
carry them as `open_questions` so they reach those tasks. The database-side defects live in
`02-database-architecture.md` §11 (DB-F1 – DB-F10) and are already applied to its §8.1.

**F1 — a parked op stalls the entire outbox, permanently.** `drainOutbox` takes
`db.outbox.orderBy("seq").first()` with **no filter on `state`**. A 4xx op is marked `failed` and left
in the table, so the next drain picks the same op, fails again, and returns. Every write queued behind
it stops syncing, silently. §2.2's own table claims this case is prevented ("a permission error
retried forever behind a spinner that never resolves") — the code does the opposite.
→ *Task 007 `g1`: the head selection must exclude `state = 'failed'`, and ops whose parent row is
parked must park with it.*

**F2 — `_dirty` is never cleared on a parked op.** It is cleared only in the success branch. A parked
row therefore stays `_dirty` forever, so `applyRemote` skips it for the rest of the session and
`reconcile`'s `gone` filter skips it too. The row freezes locally and diverges from the server with no
indication. → *One bit is not enough: the row flag needs `clean | pending | failed`, and the outbox op
`state` needs to be readable from the row. This is a blueprint fact — package B `g4`.*

**F3 — the reconcile manifest is unpaginated, and that deletes real rows.**
`select("id, updated_at").eq("artifact_id", …)` has no `.range()`. PostgREST caps the response, so on
a large artifact the manifest comes back truncated; every id past the cap is absent from `rMap`, lands
in `gone`, and is `bulkDelete`d locally. **The `bootstrapped:` meta flag then prevents re-bootstrap**,
so the loss is silent and permanent. §2.1 states the pagination rule for bootstrap and §2.4 does not
apply it. → *Task 007 `g4`: paginate the manifest, and refuse to compute `gone` from a response that
hit the page cap.*

**F4 — the broadcast trigger builds a NULL topic on cascade delete.** `tb_broadcast_highlight()` does
`select a.session_id into sid from artifacts a where a.id = r.artifact_id`. When an artifact is
deleted and cascades to its highlights, that row may already be gone, leaving `sid` NULL — and
`'ws:' || NULL` is **NULL** in Postgres, not `'ws:'`. `realtime.broadcast_changes(NULL, …)` then runs
inside the delete transaction. → *Task 001 `g3`: guard with `if sid is null then return null; end if;`*

**F5 — leader import fans out 80 messages in one batch.** Task 021 `g5` commits every accepted region
as `layer='group'` highlight + empty note **in one batch**; the per-row triggers turn a 40-highlight
import into ~80 broadcasts, and each connected member's `applyRemote` opens one Dexie transaction per
message plus a live-query re-run. That is a visible stall on a tablet. → *Either the import emits one
"reconcile this artifact" message, or `applyRemote` batches — task 007 `g3` / task 021 `g5`.*

**F6 — Dexie is namespaced per profile; OPFS is not.** The database is `thinkboard:{profileId}`
(DB-Q3, shared tablets), but the PDF cache is keyed by `storage_path` in origin-scoped OPFS. D-10
keeps the group document out of the cache by default, which contains it today — but *clear local data
on sign out* (task 016 `g6`) must wipe OPFS as well as Dexie, or the next user on a shared tablet
inherits the previous one's document bytes.

**F7 — every remote delete throws before it deletes.** `applyRemote` (v2 §2.3) runs
`db[table].get(payload.record.id)` first, for its dirty guard. On a `DELETE` broadcast `record` is
`null` — only `old_record` is set — so the lookup throws and the delete branch is never reached. Remote
deletes then only land at the next reconnect's reconcile, which on a stable connection may be days away.
→ *Task 007 `g3`: key on `(payload.record ?? payload.old_record).id`; same for the new `RETRACT` event
(db §6.1).*

**F8 — reconcile only diffs highlights.** `reconcile()` builds a manifest for `highlights` alone. A note
deleted or un-grouped while you were offline never leaves your Dexie. → *Task 007 `g4`: one manifest per
mirrored client-written table — `highlights` and `highlight_notes` — each paginated per F3.*

---

## 6. What this changes elsewhere in the plan

| What | As written | After the split |
|---|---|---|
| 000's gate | `verify:arch` green on an empty tree | fixture suite — every planted violation caught under its own id |
| 000's goals | 5 | 18, in five ordered packages, one gate each |
| `000 → 001` | 001 waits for all of 000 | **001 waits for package A only** (spec §10 needs only D-01/05/07/12 in its `open_questions`) |
| `eslint.config.mjs` | written by 000 | `eslint.architecture.mjs` by 000; spread into the generated config by 004 |
| `package.json`, npm scripts | implied by 000's gate | owned by 004; 000 ships the script file and the command string |
| Effort | 3% | **6–8%** — package D alone is a 29-row analyzer with a fixture suite |
| I27 | "in the verify script" | a named Playwright story test in task 012, recorded as `deferred` |
| Task 001 `g2` | three enums, `highlight_notes`, six columns… | …**implement `02-database-architecture.md` §8.1 verbatim**: C6, DB-F3 – DB-F10, the run-cluster policies; verify the §11 *verify* row against `0001` |
| Task 001 `g3` | two broadcast triggers | four, with the NULL-topic guard (F4) and `RETRACT` on unshare (DB-F8) |
| Task 002 | six RLS tests | thirteen — db §9 items 7–13 added |
| Task 004 `g1` | `create-next-app` | conform the existing scaffold (C9) |
| Task 007 `g1`, `g3`, `g4` | push order; realtime; manifest diff | …plus failed-op exclusion (F1), the `record ?? old_record` key and `RETRACT` (F7), manifest pagination (F3) and a notes manifest (F8) |
| Task 015 | presence and cursors on `ws:` | on a separate client-writable topic (DB-Q9), additive `0005` |
| Task 016 `g6` | clear local data on sign out | …explicitly including OPFS (F6) |
| Task folder ids | plan ids 001–024 | plan id = folder id — C7 resolved by the owner |

The decision registry (§4.1) totals **35** items, of which **four are genuinely unanswered** rather than
defaulted: `D-12` (free-tier training terms vs Perhutani document sensitivity — gates 018), `Q7`
(Bahasa Indonesia on Scribble — decides whether 024 exists), `Q8` (the real tablet mix) and `Q9`
(whether users have styluses at all). Only D-12 and Q7 block a task. Two are `confirmed` by the user —
`D-05` / `DB-Q5`, the backlog. The other 29 carry defaults, recorded as `defaulted` and never as
`confirmed`, because a default taken by a doc author is not a decision anyone has made.

**The cheapest item on this page is Q7.** Three people, their own tablets, real Indonesian, a plain
textarea — 45 minutes. It decides whether task 024 exists, whether `ink-pad` gets a painter, and
therefore what package B writes into the blueprint. Run it before 000 closes, not in week one of 012.

---

## 7. Contract scaffolding

Per `07-agent-working.md` §4.2, §4.3 and §4.6. Eighteen goals means eighteen `goal_checks` entries — §6 of
that contract admits no exceptions.

### 7.1 `agent-history/000-task-architecture-contract/task.json`

```json
{
  "id": "000-task-architecture-contract",
  "title": "Architecture contract: blueprint, AGENTS.md, verify script, lint rules",
  "architecture": "frontend",
  "secondary_architecture": [],
  "created_at": "2026-09-18T00:00:00Z",
  "status": "pending",
  "depends_on": [],
  "plan_refs": [
    { "doc": "06-whole-apps-task.md", "section": "PHASE A · 000-task-architecture-contract" },
    { "doc": "todo-task-000-split.md", "section": "§2 packages A-E, §3.0 precedence, §4.1 decision registry" },
    { "doc": "04-frontend-folder-architecture.md", "section": "§12 structural invariants" },
    { "doc": "03-frontend-architecture.md", "section": "§10 invariants, §11 blueprint extensions" },
    { "doc": "05-frontend-sync-handwriting.md", "section": "§4 new invariants I26-I28" },
    { "doc": "02-database-architecture.md", "section": "§2 scope map, §6 frontend data contract, §6.1 Dexie mirror, §10 open questions" }
  ],
  "goals": [
    { "id": "g1",  "description": "Source-precedence table; resolve C1-C9 and G1, one winner + citation each; escalate what precedence cannot settle", "plan_ref": "08 §3.0, §3", "status": "pending" },
    { "id": "g2",  "description": "Canonical invariant registry I1-I29 with enforcement class (I6 void; I26-I29 sourced outside ffa §12)", "plan_ref": "08 §4", "status": "pending" },
    { "id": "g3",  "description": "Canonical decision registry: D-01..D-12, Q1..Q11, DB-Q1..DB-Q12 (35) with state and blocks[]", "plan_ref": "08 §4.1; spec §10, v2 §6, fa §13, db §10", "status": "pending" },
    { "id": "g4",  "description": "blueprint: contexts[], domainTables[], localFirst{} incl. outbox op shape and three-state _sync row flag", "plan_ref": "08 §2 pkg B, db §6.1", "status": "pending" },
    { "id": "g5",  "description": "blueprint: commands[] with baseUrl, canvasLeaves[] with hasPainter and status, listeners[]", "plan_ref": "fa §11, split §3 C4/C5", "status": "pending" },
    { "id": "g6",  "description": "blueprint: openQuestions[] and invariants[] as machine-readable arrays", "plan_ref": "08 §3, §4", "status": "pending" },
    { "id": "g7",  "description": "blueprint.schema.json plus a self-check that runs before any cross-check", "plan_ref": "08 §2 pkg B", "status": "pending" },
    { "id": "g8",  "description": "AGENTS.md: import-direction law, placement decision tree verbatim, the three leaf kinds", "plan_ref": "ffa §8, §9, §6", "status": "pending" },
    { "id": "g9",  "description": "AGENTS.md: the 4-point store edit and the escalation rule (stop and record, never pick)", "plan_ref": "fa §5.3, split §2 pkg C", "status": "pending" },
    { "id": "g10", "description": "AGENTS.md: review checklist for I19, I27 and the runtime half of I28, each with an owner and a covering task", "plan_ref": "08 §4", "status": "pending" },
    { "id": "g11", "description": "verify-architecture.mjs harness: dependency-free, walks src/, {id,status,file,line,message}, --json, exit 1", "plan_ref": "08 §2 pkg D", "status": "pending" },
    { "id": "g12", "description": "The 15 tree-only checks: I1,I2,I4,I5,I7,I8,I9,I10,I11,I12,I14,I16,I17,I22,I24", "plan_ref": "08 §4", "status": "pending" },
    { "id": "g13", "description": "The 3 blueprint cross-checks I13,I15,I25; I25 skips conditional leaves whose gating task closed as not-needed", "plan_ref": "08 §3 C4", "status": "pending" },
    { "id": "g14", "description": "Fixture suite: one violating tree per script-class invariant plus one clean tree; each violation flagged under the correct id", "plan_ref": "08 §2 pkg D", "status": "pending" },
    { "id": "g15", "description": "Non-script invariants print as skipped with reason and owning gate; the report always shows 29 rows", "plan_ref": "08 §4", "status": "pending" },
    { "id": "g16", "description": "eslint.architecture.mjs flat-config array covering I3,I18,I20,I21,I23,I26,I29", "plan_ref": "ffa §9, split §4", "status": "pending" },
    { "id": "g17", "description": "004 handoff in writing: 000 owns neither package.json nor eslint.config.mjs; 004 g1 conforms the existing scaffold, 004 g1 and g4 gain the merge criteria", "plan_ref": "08 §1 D5, §3 C9, §6", "status": "pending" },
    { "id": "g18", "description": "Move 'green on the real tree' to task 004's gate", "plan_ref": "08 §6", "status": "pending" }
  ],
  "phases": {
    "analyze":  { "file": "analyze.json",  "status": "not_started" },
    "code":     { "file": "code.json",     "status": "not_started" },
    "test":     { "file": "test.json",     "status": "not_started" },
    "validate": { "file": "validate.json", "status": "not_started" },
    "result":   { "file": "result.json",   "status": "not_started" }
  }
}
```

### 7.2 `analyze.json` — the shape package A must fill

`sources_read` is not optional: §7.1 of `07-agent-working.md` makes reading the `plan_refs` *the* analyze
step. `open_questions` carries the four unanswered decisions **and** the eight defects from §5.3, so
they reach tasks 001, 007, 016 and 021 instead of dying here.

```json
{
  "task_id": "000-task-architecture-contract",
  "phase": "analyze",
  "started_at": "",
  "completed_at": "",
  "sources_read": [
    { "doc": "06-whole-apps-task.md", "section": "PHASE A, §2 dependency graph, §5 standing rules" },
    { "doc": "04-frontend-folder-architecture.md", "section": "§4, §5.2, §8, §9, §12" },
    { "doc": "03-frontend-architecture.md", "section": "§5.3, §10, §11, §13" },
    { "doc": "05-frontend-sync-handwriting.md", "section": "§2, §4, §6" },
    { "doc": "02-database-architecture.md", "section": "§2, §6, §6.1, §8.1, §10, §11" },
    { "doc": "01-thinkboard-lite-spec.md", "section": "§4.3, §5.3, §6, §10" },
    { "doc": "todo-task-000-split.md", "section": "§3.0, §3, §4, §4.1, §5.3" },
    { "doc": "frontend-thinkboard-lite/", "section": "package.json, tsconfig.json, components.json, AGENTS.md (C9)" },
    { "doc": "agent-history/running-process.json", "section": "task_sequence (C7)" }
  ],
  "scope": "Contract artifacts only: blueprint, AGENTS.md, verify script + fixtures, lint rule array. No create-next-app, no package.json, no eslint.config.mjs, no product code.",
  "acceptance_criteria": [
    { "goal_id": "g1", "text": "C1-C9 and G1 in split §3 each have one recorded winner with a doc + section citation, or an escalation naming the human (C6); C7 recorded as resolved by the owner." },
    { "goal_id": "g2", "text": "The invariant registry totals 29 rows with I6 marked void and every row carrying an enforcement class." },
    { "goal_id": "g3", "text": "The decision registry totals 35 rows; exactly four carry state 'unanswered'; only D-05 and DB-Q5 carry 'confirmed'." },
    { "goal_id": "g4", "text": "localFirst declares 7 Dexie tables, the compound [artifactId+page] index, and the three-state _sync flag, identical to db §6.1." },
    { "goal_id": "g5", "text": "commands[] carries baseUrl; canvasLeaves[] has 5 entries and ink-pad is status 'conditional'." },
    { "goal_id": "g6", "text": "openQuestions[] and invariants[] are arrays, not prose." },
    { "goal_id": "g7", "text": "A blueprint with a deliberately wrong table name fails the self-check before any cross-check runs." },
    { "goal_id": "g8", "text": "The placement decision tree is byte-identical to 04-frontend-folder-architecture.md §8." },
    { "goal_id": "g9", "text": "AGENTS.md states the escalation rule as a procedure with a destination (openQuestions[])." },
    { "goal_id": "g10", "text": "I19, I27 and I28 each name an owner and the task whose test covers them." },
    { "goal_id": "g11", "text": "The harness runs on a tree with no node_modules, exits 1 on any fail, and exits 1 when src/ is missing." },
    { "goal_id": "g12", "text": "All 15 tree-only checks are implemented and each has a fixture." },
    { "goal_id": "g13", "text": "I25 passes on a blueprint whose conditional leaf has no painter and whose gating task is closed as not-needed." },
    { "goal_id": "g14", "text": "Every planted violation is reported under its own invariant id; the clean fixture is green." },
    { "goal_id": "g15", "text": "The report prints 29 rows on every run, including skipped ones." },
    { "goal_id": "g16", "text": "The lint array flags every planted violation in the lint fixture and is clean on the good one." },
    { "goal_id": "g17", "text": "Task 004's task.json carries both handoff criteria before 000 closes." },
    { "goal_id": "g18", "text": "Task 004's gate includes 'verify:arch green on the scaffolded tree'." }
  ],
  "open_questions": [
    "D-12 free-tier training terms vs Perhutani document sensitivity — unanswered, gates task 018.",
    "Q7 Bahasa Indonesia handwriting on the pilot's tablets — unanswered, decides whether task 024 exists and therefore whether ink-pad is a conditional canvas leaf. 45-minute test; run before 000 closes.",
    "Q8 the real tablet mix (iPad vs Samsung S Pen vs other Android) — unanswered.",
    "Q9 whether pilot users have styluses at all — assumed yes, unverified.",
    "C6: note_input_mode must be a three-value enum with transcribed_by. spec §6 disagrees with v2 §5 and db §4, and the precedence rule points at the wrong doc. Carry to task 001 g2.",
    "F1 outbox head-of-line stall on a parked 4xx op — carry to task 007 g1.",
    "F2 _dirty is never cleared on a parked op; the row flag needs three states — affects blueprint g4 and task 007.",
    "F3 the reconcile manifest is unpaginated and can bulkDelete real local rows — carry to task 007 g4.",
    "F4 broadcast trigger builds a NULL topic on cascade delete — carry to task 001 g3.",
    "F5 leader import fans out ~80 broadcasts in one batch — carry to task 021 g5 / task 007 g3.",
    "F6 OPFS is not namespaced per profile while Dexie is — carry to task 016 g6.",
    "F7 applyRemote reads payload.record.id, which is null on DELETE — carry to task 007 g3.",
    "F8 reconcile diffs highlights only; notes need their own manifest — carry to task 007 g4.",
    "C7 resolved by the owner 2026-09-18: agent-history cleared, plan id = folder id for 000-024.",
    "C8 state library: Redux Toolkit per 03-frontend-architecture.md, not spec §5.3's TanStack Query + Zustand.",
    "C9 the scaffold already exists without src/ — task 004 g1 becomes 'conform the scaffold'; AGENTS.md keeps Next's agent-rules block.",
    "G1 / DB-Q12 non-mirrored tables have no legal read path — defaulted to Dexie meta + outbox; package B waits on it.",
    "db §11: DB-F1..DB-F10 applied in §8.1 — carry to task 001 g2/g3 and task 002 (tests 7-13); DB-Q6 blocks 001/008, DB-Q9 blocks 015."
  ],
  "risks": [
    "Package A is an agent making ten judgement calls, which is the behaviour package C forbids. A resolves only what precedence decides.",
    "Package D is 2-3 days of analyzer work against a fixture suite; the original 3% estimate covers roughly half of it.",
    "I25 becomes permanently red if ink-pad ships hasPainter:true and task 024 is deleted."
  ]
}
```

### 7.3 `validate.json.goal_checks` — eighteen entries, no exceptions

```json
{
  "task_id": "000-task-architecture-contract",
  "phase": "validate",
  "goal_checks": [
    { "goal_id": "g1",  "status": "", "notes": "" },
    { "goal_id": "g2",  "status": "", "notes": "" },
    { "goal_id": "g3",  "status": "", "notes": "" },
    { "goal_id": "g4",  "status": "", "notes": "" },
    { "goal_id": "g5",  "status": "", "notes": "" },
    { "goal_id": "g6",  "status": "", "notes": "" },
    { "goal_id": "g7",  "status": "", "notes": "" },
    { "goal_id": "g8",  "status": "", "notes": "" },
    { "goal_id": "g9",  "status": "", "notes": "" },
    { "goal_id": "g10", "status": "", "notes": "" },
    { "goal_id": "g11", "status": "", "notes": "" },
    { "goal_id": "g12", "status": "", "notes": "" },
    { "goal_id": "g13", "status": "", "notes": "" },
    { "goal_id": "g14", "status": "", "notes": "" },
    { "goal_id": "g15", "status": "", "notes": "" },
    { "goal_id": "g16", "status": "", "notes": "" },
    { "goal_id": "g17", "status": "", "notes": "" },
    { "goal_id": "g18", "status": "", "notes": "" }
  ],
  "cross_check_against_plan": [
    { "doc": "04-frontend-folder-architecture.md", "section": "§12", "result": "" },
    { "doc": "03-frontend-architecture.md", "section": "§11", "result": "" },
    { "doc": "05-frontend-sync-handwriting.md", "section": "§4", "result": "" },
    { "doc": "02-database-architecture.md", "section": "§2", "result": "" },
    { "doc": "todo-task-000-split.md", "section": "§3 conflict verdicts, §4.1 decision registry", "result": "" }
  ],
  "signed_off": false,
  "issues_found": []
}
```

### 7.4 `agent-thinking/tracking-todo.json` entry

```json
{
  "id": "000-todo-architecture-contract",
  "name": "Architecture contract, split into five packages",
  "goal": "Produce the machine-readable contract an agent generates from, so no file is ever created by inference.",
  "todo_path": "agent-thinking/todo/000-todo-architecture-contract/contract.json",
  "agent_history": "agent-history/000-task-architecture-contract",
  "status": "pending"
}
```

---

## 8. Standing rules, unchanged

`analyze.json` before any code · one `validate.json.goal_checks` entry per mini-goal, **now eighteen
of them** · anything touching RLS or stage transitions cannot reach validate with
`test.json.summary.total: 0` · open decisions get raised in `analyze.json.open_questions`, never
silently resolved · **no git write without explicit confirmation, every time** (`09-agent-limitation.md`
§1), landing on the shadow branch and never on `master` · `npm run verify` green before a task closes.

---

## 9. Sources

In repo: `10-abstract-plan-superseded.md`, `05-frontend-sync-handwriting.md` (v2),
`01-thinkboard-lite-spec.md` (spec), `02-database-architecture.md` (db), `06-whole-apps-task.md`
(whole-apps), `03-frontend-architecture.md` (fa), `04-frontend-folder-architecture.md` (ffa),
`07-agent-working.md`, `08-agent-todo-intake.md`, `09-agent-limitation.md`. **"split" in `plan_ref`s means this file,
`todo-task-000-split.md`** (archived as `claude-artifact/08-task-000-split.md`).

Repository state, inspected 2026-09-18 for C7 and C9: `agent-history/running-process.json`,
`frontend-thinkboard-lite/{package.json, tsconfig.json, components.json, AGENTS.md, lib/utils.ts}`.

External, checked September 2026 for §5.1: PowerSync's Supabase integration and 2026 changelog;
the Databricks acquisition of Electric, August 2026.
