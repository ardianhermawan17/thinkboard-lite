# ThinkBoard Lite — main gate

**Every agent session starts here and follows it top to bottom.** This is the one document that says how
an agent *thinks* (reads, decides, escalates) and how it *works* (`agent-thinking/` → `agent-history/` →
git). `CLAUDE.md` imports it; the numbered docs hold the detail it points to.

ThinkBoard Lite is a shared PDF workspace: every highlight is a focus point, every focus point carries
notes (typed or handwritten), and the workspace produces a private and a group conclusion — collaborative
by default, still working with the network off. This repo is the **plan and the process**. The app is
[`frontend-thinkboard-lite/`](frontend-thinkboard-lite/README.md); the Supabase project (migrations `0001`–`0005`) is
[`database-thinkboard-lite/`](database-thinkboard-lite/). Git runs from this repo's root only.

---

## 1. The gate — every session, in order

```
 0 ORIENT ──▶ 1 INTAKE ──▶ 2 READY? ──▶ 3 OPEN ──▶ 4 WORK ──▶ 5 CLOSE
 running-     agent-        plan doc     agent-      analyze     result.json
 process      thinking      §0, §3       history     code test   tracking done
 .json        contract                   task.json   validate    ask before git
```

### Gate 0 — Orient

1. Read `agent-history/running-process.json` **before any other file** (`07-agent-working.md` §0.3).
2. `current_task_id` is set → **resume**: re-validate that task's `current_phase` file (a crash can leave
   it half-written), then continue that phase. Start nothing else.
3. `status: "idle"` → go to Gate 1.
4. Check the intake invariants (§3 below). A broken one is the first thing to report.

### Gate 1 — Intake (`agent-thinking/`)

1. A prompt flagged **"Human Mode"** → ask clarifying questions before anything else (`09-agent-limitation.md` §3).
2. Map the ask to a task in [`06-whole-apps-task.md`](06-whole-apps-task.md). An ask no task covers is a
   **new task**: add it to 06 with the next free `NNN`, and write its plan doc first.
3. Write `agent-thinking/todo/NNN-todo-<slug>/contract.json` — `id`, `name`, `human_prompt` (verbatim),
   `translated_prompt_agent` (the ask as concrete steps against the real repo).
4. Add its entry to `agent-thinking/tracking-todo.json` — `agent_history: null`, `status: "pending"`. The
   entry is ready-made in the task's plan doc §7.4.

### Gate 2 — Ready?

Open the plan doc `todo-task-NNN-<slug>.md` and check, in this order:

1. **Starts when** (§0) — e.g. 018 is blocked on D-12, 024 exists only if 012 `g6` fails, 001 needs only
   000's package A.
2. Every `depends_on` task is `done` in `running-process.json.task_sequence`.
3. §3 decisions: an **unanswered** row that touches a goal, or a *new* row, is raised to the human
   **now** — the goal it touches does not start until answered. Defaulted rows go into `open_questions`.

Not ready → say which condition failed and stop. Never work around a gate.

### Gate 3 — Open (`agent-history/`)

In one step, so the three files never disagree:

1. Create `agent-history/NNN-task-<slug>/task.json` from the plan doc §7.1.
2. `running-process.json`: add the `task_sequence` row; set `current_task_id`, `current_phase: "analyze"`,
   `history_path`, `status: "in_progress"`.
3. `tracking-todo.json`: set the entry's `agent_history` to the folder path and `status: "in_progress"`.

### Gate 4 — Work: five phases, five files

`running-process.json` is updated at the **start and end** of every phase. Phase files are created only when
the phase starts.

| Phase | File | Must contain | Cannot leave the phase until |
|---|---|---|---|
| Analyze | `analyze.json` | `sources_read` (doc **and** §), `scope`, one acceptance criterion per goal, every D-/Q-/DB-Q- row from the plan doc §3 in `open_questions` | nothing is guessed — open questions are asked, not answered |
| Code | `code.json` | `files_changed`, `decisions` made while coding, `commands_run` | only `acceptance_criteria` is implemented — growth becomes a follow-up task |
| Test | `test.json` | test files, commands + results, `summary` | RLS or stage-transition work has `summary.total > 0` |
| Validate | `validate.json` | one `goal_checks` entry per goal, `cross_check_against_plan` | every goal `pass`, or `blocked` with a reason; then `signed_off: true` |
| Result | `result.json` | `final_status`, `goals_summary` **recomputed** from `task.json`, `artifacts`, `follow_up_tasks` | — |

### Gate 5 — Close

1. Write `result.json`; set `task.json.status`.
2. Task `done` → the tracking entry's `status: "done"`. A `blocked` or `cancelled` task keeps its entry
   `in_progress`, and `result.json` says why.
3. `running-process.json`: the row's status; `current_task_id: null`, `current_phase: "idle"`,
   `history_path: null`, `status: "idle"`.
4. **Sync (ClickUp → Notion)** — follow [`notion-clickup-procedure-work.md`](notion-clickup-procedure-work.md):
   read the task from **ClickUp** first, then report it on **Notion**. Skip only if the ClickUp/Notion MCP
   tools are unavailable, and say so in the report.
5. Report. **Any git write needs the user's explicit yes, every time** (§7).

### After Gate 5 — ClickUp → Notion reporting

The board and the log are mirrors of this repo, kept by one procedure:
[`notion-clickup-procedure-work.md`](notion-clickup-procedure-work.md).

```
 ClickUp (live board)  ──read task──▶  agent  ──report──▶  Notion (history log)
 List 1100340000052535                 checks it against    Thinkboard Lite ▸ Work log
 to do / in progress / complete        running-process     (done, decisions, lessons)
                                       + result.json
```

1. **Get the task from ClickUp** — `clickup_filter_tasks` (`include_closed: true`) / `clickup_get_task`. Task
   names are `NNN <Title>`; the description carries the refs to `06-whole-apps-task.md` and the plan doc.
2. **Reconcile** it with `agent-history/running-process.json` and the task's `result.json`. The repo wins on a
   mismatch: fix ClickUp (status, ticked goals), never the other way round.
3. **Report on Notion** — append the closed task, its commit, decisions and follow-ups to the work-log page.
   Notion is history, not a task list; the live list stays in ClickUp.
4. Regenerate [`clickup.md`](clickup.md) and [`notion.md`](notion.md) (repo-side snapshots). Writing them is
   free; committing them needs the user's yes (§7).

Never put secrets or Perhutani document content in either tool; reference file paths only.

---

## 2. How an agent thinks

- **Read before you write.** `analyze.json.sources_read` *is* the read step. Cite doc **and** section; never
  paraphrase a rule you can cite (`RULE-nn`, `I-nn`, `D-nn`, `Q-n`, `DB-Qn`, `C-n`, `F-n`, `DB-Fn`).
- **One home per fact.** Schema and RLS → `02-database-architecture.md` §8.1. Dexie mirror and outbox →
  §6.1 of that doc. Invariants I1–I29 and decisions → `todo-task-000-split.md` §4 and §4.1. What to build
  → `06-whole-apps-task.md` plus the task's plan doc. Never restate a fact in a second place; point at it.
- **Precedence** when docs disagree (`todo-task-000-split.md` §3.0): the user's word > process (07, 08, 09)
  > the task-000 split, for task 000 > the backlog (06) > schema (02) > frontend structure (04) > frontend
  mechanism (03 + 05) > product intent (01). Archives never win.
- **Ask, don't invent.** Two sources disagree, or something needed is missing: **stop, record it in
  `open_questions` / `openQuestions[]`, and ask.** Never pick. A default a doc author took is `defaulted`;
  only a human's word makes it `confirmed`.
- **No invented structure.** No table, endpoint, package, folder or topic that the docs do not list. If one
  seems needed, that is a question.
- **Scope is fixed at analyze.** Anything new becomes a follow-up task in `result.json`, not an in-flight
  change.

---

## 3. `agent-thinking/` and `agent-history/` — used correctly

| | `agent-thinking/` — **intake** | `agent-history/` — **execution** |
|---|---|---|
| Answers | *what was asked, and what it means* | *what was done, phase by phase* |
| Written | when a human asks (Gate 1) | when the work starts (Gate 3), then every phase |
| Holds | `todo/NNN-todo-<slug>/contract.json` + `tracking-todo.json` | `NNN-task-<slug>/{task,analyze,code,test,validate,result}.json` + `running-process.json` |
| Rules | `08-agent-todo-intake.md` | `07-agent-working.md` |
| Never | holds code or phase results | is deleted from, or created ahead of the work |

`NNN` and `<slug>` are identical across the plan doc, the contract and the task folder — any one finds the
other two. Plan id = folder id (`000`–`024`), and numbers are never reused.

**Invariants — checked at Gate 0:**

1. Every `agent-thinking/todo/*` folder has exactly one `tracking-todo.json` entry, and vice versa.
2. Every non-null `agent_history` path exists and has a `running-process.json.task_sequence` row.
3. `running-process.json` is either idle with every field null/idle, or points at an existing folder whose
   `task.json.phases` agrees with `current_phase`.
4. Every JSON file parses — no comments, no trailing commas — and every phase file's `task_id` equals its
   folder name.

---

## 4. Docs, in reading order — architecture first

| # | Doc | What it is | Authority |
|---|---|---|---|
| 01 | [`01-thinkboard-lite-spec.md`](01-thinkboard-lite-spec.md) | the Lite spec: the loop, RULE-01…25, mechanisms, D-01…12 | product intent |
| 02 | [`02-database-architecture.md`](02-database-architecture.md) | scope map, ERDs, frontend data contract, Dexie mirror, **final `0004_lite.sql`**, review | schema, RLS, Dexie |
| 03 | [`03-frontend-architecture.md`](03-frontend-architecture.md) | why the frontend diverges: Dexie, commands-only RTK Query, painters, 4-point store edit | frontend mechanism |
| 04 | [`04-frontend-folder-architecture.md`](04-frontend-folder-architecture.md) | folders, aliases, leaves, placement tree, invariants I1–I25 | frontend structure |
| 05 | [`05-frontend-sync-handwriting.md`](05-frontend-sync-handwriting.md) | Dexie ⇄ Supabase sync; handwriting = a plain `<textarea>`; I26–I28 | amends 03 |
| 06 | [`06-whole-apps-task.md`](06-whole-apps-task.md) | **the backlog** — 25 tasks, phases A–F, dependency graph, LLM routing | what to build |
| 07 | [`07-agent-working.md`](07-agent-working.md) | the JSON contracts and phase rules behind Gates 3–5 | process |
| 08 | [`08-agent-todo-intake.md`](08-agent-todo-intake.md) | the intake contract behind Gate 1 | process |
| 09 | [`09-agent-limitation.md`](09-agent-limitation.md) | git limits, Human Mode | overrides everything |
| — | [`notion-clickup-procedure-work.md`](notion-clickup-procedure-work.md) | how an agent reads tasks from ClickUp and reports them on Notion (MCP) | process (sync only) |
| — | [`clickup.md`](clickup.md), [`notion.md`](notion.md) | board snapshot (done / ongoing / to do) and historical log | explanatory |
| 10 | [`10-abstract-plan-superseded.md`](10-abstract-plan-superseded.md) | how the design got here | superseded by 01 |
| — | `todo-task-NNN-<slug>.md` | one plan doc per task (§5) | its task's scope |

Explanatory only: the `*.html` companions (visual walkthroughs of 01, 03, 05 and 06). Archived, git-ignored,
never cited: `claude-artifact/`, `old/`. New notes continue the numbering at **11**.

---

## 5. The task map

Every task in `06-whole-apps-task.md`, with its plan doc. Status is `running-process.json`'s; a task not yet
in `task_sequence` is *not opened*.

| Phase | Task | Plan doc | Arch | Depends on | Status |
|---|---|---|---|---|---|
| A | 000 architecture contract | [todo-task-000-split](todo-task-000-split.md) | frontend | — | **done** |
| B | 001 Supabase Lite migration | [todo-task-001](todo-task-001-supabase-lite-migration.md) | supabase | 000 (pkg A) | **done** |
| B | 002 RLS access proof | [todo-task-002](todo-task-002-rls-access-proof.md) | supabase | 001 | **done** |
| B | 003 types and seed | [todo-task-003](todo-task-003-types-and-seed.md) | supabase | 001 | **done** — g3 as placeholder rows; D-12 still open |
| C | 004 conform the scaffold | [todo-task-004](todo-task-004-frontend-scaffold.md) | frontend | 000 | **done** |
| C | 005 design system | [todo-task-005](todo-task-005-design-system.md) | frontend | 004 | **done** |
| C | 006 entities kernel | [todo-task-006](todo-task-006-entities-kernel.md) | frontend | 004 | **done** |
| C | 007 sync kernel | [todo-task-007](todo-task-007-sync-kernel.md) | frontend | 006 | **done** |
| D | 008 auth + workspace shell | [todo-task-008](todo-task-008-auth-and-workspace-shell.md) | frontend | 002 003 005 006 | **done** |
| D | 009 PDF canvas | [todo-task-009](todo-task-009-pdf-canvas.md) | frontend | 003 008 | **done** |
| D | 010 text highlight | [todo-task-010](todo-task-010-text-highlight.md) | frontend | 009 | **done** |
| D | 011 region highlight + OCR | [todo-task-011](todo-task-011-region-highlight-and-ocr.md) | frontend | 009 | **done** |
| D | 012 notes + handwriting | [todo-task-012](todo-task-012-notes-and-handwriting.md) | frontend | 010 | **blocked** (3/7) |
| D | 013 sheets + promotion | [todo-task-013](todo-task-013-sheets-and-promotion.md) | frontend | 010 012 | not opened |
| D | 014 result UI against a stub | [todo-task-014](todo-task-014-result-ui-against-stub.md) | frontend | 013 | not opened |
| D | 015 realtime presence | [todo-task-015](todo-task-015-realtime-presence.md) | frontend | 007 | not opened |
| D | 016 offline + export | [todo-task-016](todo-task-016-offline-and-export.md) | frontend | 007 | not opened |
| E | 017 command endpoints | [todo-task-017](todo-task-017-command-endpoints.md) | backend | 001 | not opened |
| E | 018 LLM adapter | [todo-task-018](todo-task-018-llm-adapter.md) | backend | 017 | **blocked on D-12** |
| E | 019 mini-conclusion | [todo-task-019](todo-task-019-mini-conclusion.md) | backend | 018 | not opened |
| E | 020 result engine | [todo-task-020](todo-task-020-result-engine.md) | backend | 014 018 019 | not opened |
| E | 021 leader import | [todo-task-021](todo-task-021-leader-import.md) | frontend | 010 011 | not opened |
| F | 022 responsive, motion, theme | [todo-task-022](todo-task-022-responsive-motion-theme.md) | frontend | — (after 008–013) | not opened |
| F | 023 pilot hardening | [todo-task-023](todo-task-023-pilot-hardening.md) | backend | 015 016 020 022 | not opened |
| F | 024 ink fallback | [todo-task-024](todo-task-024-ink-fallback.md) | frontend | 012 | **conditional on 012 g6** |

```
Critical path = the demoable slice:  000 → 001 → 004 → 006 → 008 → 009 → 010 → 012
(highlight a PDF, write a note with a stylus, persist and sync — no backend, no model calls)
```

---

## 6. Where things stand — 2026-09-25

- **Done:** 000 (architecture contract), 001 (`0004_lite.sql` in `database-thinkboard-lite/`), 002 (the RLS proof:
  56 checks in `database-thinkboard-lite/supabase/tests/`, each policy mutation-tested) and 004 (the scaffold conformed
  to the folder law under `src/`; `npm run verify` is green on the real tree: `verify:arch` 18/0, lint, typecheck,
  Vitest with a Storybook story test in Chrome, Serwist registering in a `--webpack` production build).
- **Also done:** 003 (types and seed) — the seed, storage (`0005_storage_artifacts.sql`), `npm run db:seed`, the
  generated domain types (`npm run gen:types` → `src/shared/types/domain/`, ids and timestamps branded, I9 green) and
  the settings-dropdown rows. **Those provider rows are placeholders** (inactive, `placeholder.invalid`, "D-12 pending",
  no key, no real provider named): D-12 is still unanswered, and the placeholders decide nothing.
- **Also done:** 006 (entities kernel) — the Dexie mirror under `src/features/entities/`: the seven-table schema per profile,
  repositories that write the row and its outbox entry in one transaction, `apply-remote`, and one live-query hook per table
  (34 tests under fake-indexeddb; a mutation of the transaction scope turns 5 of 6 repository tests red). Recorded slim:
  `analyze.json` + `result.json` only.
- **Also done:** 005 (design system) — the 10 remaining shadcn atoms, highlight colour tokens for light and dark, the store seam
  (`stripUi`, persist config, listener middleware, typed hooks; **no slices yet**), `LibraryProvider` in the fixed order,
  and `useBreakpoint`. A production build boots in Chrome in both themes with no console errors; `npm run verify` is
  green with I5/I11/I12/I16 now live. It also corrected `components.json` to import aliases (the old form broke `sheet` and
  `dialog`). Recorded slim.
- **Also done:** 008 (auth and workspace shell) — Supabase sign-in with a cached session, the `workspace` slice, workspace create and
  leadership transfer through the definer RPCs, the two persona editors, and the shell (header with sync pill, mode and theme
  switches; right rail) behind a client-only `/w` route. Gate test 5/5 under real RLS against the seeded stack; a production build
  passed a real-Chrome pass including an offline reopen. That pass found and fixed a reload crash at the persist seam
  (`autoMergeLevel2`). Writes are direct and online until 007 and 017 exist. Recorded slim.
- **Also done:** 007 (sync kernel) — outbox push (strict seq order, a 4xx parks without stalling the queue, one queued op per row),
  the realtime channel (setAuth before subscribe and on every refresh, bursts applied in one transaction), the paginated
  manifest reconcile and bootstrap, the `sync` slice, the listener middleware (push, then pull, then resubscribe) and the
  sync-status-pill. The writes of 008 now ride the outbox. Gate: a live-stack test under real RLS plus a two-browser Chrome pass
  (a shared row reaches both, a private row only its owner, an offline write lands once); four mutations each turned their
  test red. Recorded slim; stacked on 008.
- **Also done:** 009 (PDF canvas) — OPFS cache per profile, ±1 page windowing, the `page-stage` leaf, the viewport slice with Pointer-Events pinch/pan, and
  `geometry.ts`; `npm run verify` green (180 tests). Q8's on-device 60 fps check is a follow-up.
- **Also done:** 010 (text highlight) — Selection/Range capture over the text layer, the deterministic `h-pNN-NN-xxxxxx` slug, `highlight-layer` + painter, a
  zoom-then-reload test, and a reusable jsdom canvas-2D stub. `npm run verify` green (180 tests).
- **Also done:** 011 (region highlight + OCR) — the `marquee` canvas leaf + painter (rectangle and freehand), Pointer-Event stylus handling with palm
  rejection, `shared/lib/ocr.ts` (lazy, cropped Tesseract, fail-soft), the derived 0.70 confidence gate, and four Chrome stories including ManyStrokes
  (220 points). `npm run verify` green (231 tests) and a production build ok; added `tesseract.js ^7`. Its own on-device 60 fps / 200-point Gate waits on Q8/Q9.
- **Closed blocked:** 012 (notes + handwriting) — the note editor, the ruled-paper handwriting `<textarea>` (I26) and the I27 composition pass; Q7/Q8/Q9,
  C6 and g7's literal Playwright shape remain. It keeps 013/014 blocked.
- **Next:** 013 needs 012 (blocked); 021 (leader import) is now unblocked by 010 + 011; 015 (presence) and 016 (offline + export) are unblocked by 007.
  015 must first resolve its plan doc's `0005_live_topic.sql` against the already-shipped `0005_storage_artifacts.sql`.
  Open housekeeping: revoke anon EXECUTE on the definer RPCs, and let teammates read the profile names of their team.
- **Waiting on a human:**
  - **D-12** — free-tier training terms vs document sensitivity. Blocks 018, and ink transcription in 024. 003's
    placeholder provider rows stand in until it is answered.
  - **Q7** — the 45-minute Bahasa Indonesia handwriting test. Decides 024, and the blueprint's `ink-pad`.
  - **Q8, Q9** — the real tablet mix; whether users have styluses.
  - **Raised in plan docs:** the workspace-create path before 017 exists (008); Vault access under the user's
    JWT (018); adding members to a team needs its own definer RPC, like `create_workspace` (008).
- **Local stacks:** the Lite stack runs on ports 553xx (`database-thinkboard-lite/supabase/config.toml`), beside the
  Full project's stack on 543xx.
- `agent-history/_example/` is a filled-in reference task from the Full era, kept outside the numbered space.

---

## 7. Hard limits

- **Git** (`09-agent-limitation.md`): every `commit`, `push`, `merge`, `pull --rebase`, branch delete or
  `gh pr create` needs an explicit yes, every time. Writes land on the session's shadow branch, never on
  `master` — not even a fast-forward. Git runs from this repo's root only; `frontend-thinkboard-lite/` and
  `database-thinkboard-lite/` have no `.git` of their own.
- **No service-role key in Lite** (RULE-01 / DB-1). RLS *is* the authorization layer.
- **Supabase key names:** use the publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys.
  `anon` / `service_role` are deprecated by end-2026, and `0003_grant_schema.sql` still uses them.
- **Easy to get wrong:** the schema is 02 §8.1, not 01 §6. The state library is Redux Toolkit, with RTK Query
  for the four commands only — no TanStack Query, no Zustand (C8). Handwriting is a plain `<textarea>`; the
  ink pad is a conditional fallback. Next 16 is newer than any model's training data — read
  `frontend-thinkboard-lite/node_modules/next/dist/docs/` first.

---

## 8. Repository layout

```
README.md                 this main gate          CLAUDE.md   imports it
01- … 10-*.md             the docs, in reading order (§4)
todo-task-NNN-<slug>.md   one plan doc per task (§5)
*.html                    visual companions
agent-thinking/           intake: todo/NNN-todo-<slug>/contract.json + tracking-todo.json
agent-history/            execution: NNN-task-<slug>/ + running-process.json
frontend-thinkboard-lite/ the Next.js app — own CLAUDE.md and AGENTS.md
database-thinkboard-lite/ the Supabase project — migrations 0001-0005, seed, tests, its own README
backend-thinkboard-lite/  (later) the Go backend — a sibling of database-thinkboard-lite/, not created yet
claude-artifact/ old/     archived snapshots — git-ignored, never edited
```
