# ThinkBoard Lite — ClickUp task board

Snapshot: 2026-09-19 · Branch: `claude/task-002` · ClickUp List: `1100340000052535` (Space `1100340000040153`)

**Master reference for every task:** [`06-whole-apps-task.md`](06-whole-apps-task.md) (heading `### NNN-task-<slug>`).
**Parsed plan doc per task:** `todo-task-NNN-<slug>.md` (goals, gate, decisions, contract scaffolding).
**Live state:** `agent-history/running-process.json` + `agent-thinking/tracking-todo.json`.
Statuses in the List: `to do` · `in progress` · `complete`. ClickUp hides `complete` tasks by default — turn on **Show closed** to see the DONE list.

## Summary

| Status | Count | Tasks |
|---|---|---|
| complete | 4 | 000, 001, 002, 004 |
| in progress | 2 | 003 (partial: g2 g4 g5 done, g1 unblocked, g3 blocked on D-12), Housekeeping (pipeline itself is `idle`) |
| to do | 20 | 005–024 (018 blocked on D-12, 024 conditional) |

Critical path: 000 → 001 → 004 → 006 → 008 → 009 → 010 → 012. Highest risk: 010, then 007.

---

## DONE (complete)

| ID | Task | ClickUp | Closed | Goals | 06 section | Plan doc | Agent history |
|---|---|---|---|---|---|---|---|
| 000 | Architecture contract | [z8r3fdg7gn](https://app.clickup.com/t/z8r3fdg7gn) | 2026-09-18 | 18/18 | `000-task-architecture-contract` | `todo-task-000-split.md` | `agent-history/000-task-architecture-contract/` |
| 001 | Supabase Lite migration | [z8r3fdg7gp](https://app.clickup.com/t/z8r3fdg7gp) | 2026-09-18 | 7/7 | `001-task-supabase-lite-migration` | `todo-task-001-supabase-lite-migration.md` | `agent-history/001-task-supabase-lite-migration/` |
| 002 | RLS access proof | [z8r3fdg7gq](https://app.clickup.com/t/z8r3fdg7gq) | 2026-09-18 | 16/16 | `002-task-rls-access-proof` | `todo-task-002-rls-access-proof.md` | `agent-history/002-task-rls-access-proof/` |
| 004 | Conform frontend scaffold | [z8r3fdg7gt](https://app.clickup.com/t/z8r3fdg7gt) | 2026-09-19 | 6/6 | `004-task-frontend-scaffold` | `todo-task-004-frontend-scaffold.md` | `agent-history/004-task-frontend-scaffold/` |

### 000 — Architecture contract (frontend, Phase A)
Main goal: produce the machine-readable contract an agent generates from, so no file is ever created by inference.
- [x] g1 `architecture.blueprint.json`
- [x] g2 `AGENTS.md`
- [x] g3 `verify-architecture.mjs` with I11–I29
- [x] g4 ESLint architecture rules
- [x] g5 `openQuestions[]` in the blueprint

Gate passed: `node scripts/verify-architecture.mjs --fixtures` catches every planted violation. Artifacts: blueprint + schema, verify script/fixtures/tests, `eslint.architecture.mjs` + tests, `AGENTS.md`, `CLAUDE.md`, frontend README.

### 001 — Supabase Lite migration (supabase, Phase B)
Main goal: the Lite schema exists on a fresh project.
- [x] g1 0001–0003 clean on fresh stack
- [x] g2 `0004_lite.sql` (enums, `highlight_notes`, `can_lead_session()`, `promote_highlight()`, touch triggers)
- [x] g3 Two broadcast triggers, per-row topic
- [x] g4 Two `realtime.messages` policies
- [x] g5 Drop/recreate two policies (only non-additive change)
- [x] g6 `supabase db reset` clean twice

Gate passed. Artifacts: migrations 0001–0004, `config.toml`, `02-database-architecture.md` §8.1.

### 002 — RLS access proof (supabase, Phase B)
Main goal: prove the access model in code (DB-1: RLS is the authorization layer).
- [x] g1 Seed two members + leader
- [x] g2 B cannot select A's private highlight
- [x] g3 B cannot select A's private `mini_conclusion`
- [x] g4 B cannot insert `layer='group'`; leader can
- [x] g5 B receives A's promoted highlight on `ws:{sessionId}`; private on no topic
- [x] g6 `promote_highlight()` flips highlight+note, refuses others' rows

Gate passed (commit `c67991b`). Artifacts: `supabase/tests/rls.sql`, `rls.test.mjs`.

### 004 — Conform frontend scaffold (frontend, Phase C)
Main goal: the existing scaffold obeys the folder law, so no later task has to retrofit it.
- [x] g1 scaffold moved under `src/`; four aliases in tsconfig AND vitest.config.mts; architecture lint spread in
- [x] g2 `src/{app,features,shared}` skeleton; components.json rebound to the three tiers
- [x] g3 Vitest (jsdom + fake-indexeddb) and Storybook + Playwright (story test in headless Chrome)
- [x] g4 scripts verify:arch, lint, typecheck, test, verify
- [x] g5 Serwist (`@serwist/next`), disabled in dev; a production build registers the worker
- [x] g6 verify:arch green on the real tree (18/0) and exits 1 without `src/`

Gate passed: `npm run verify` green on the real tree. Owner-visible: `build` is `next build --webpack`; ESLint 9; Vitest 4; a task-000 verifier parser bug fixed; a browserslist override (audit 0). Branch `claude/task-004`, not yet committed.

---

## IN PROGRESS

| Item | ClickUp | Notes |
|---|---|---|
| 003 Types and seed (partial: g2 g4 g5 done; g1 unblocked by 004, g3 on D-12) | [z8r3fdg7gr](https://app.clickup.com/t/z8r3fdg7gr) | migration `0005_storage_artifacts.sql`, `seed.sql`, `npm run db:seed`; `agent-history/003-task-types-and-seed/` (result: blocked); tests `test:seed` 6/6, `npm test` 17/17 |
| Housekeeping: merge task-002 PR, resolve owner decisions | [z8r3fdg7hf](https://app.clickup.com/t/z8r3fdg7hf) | PR for `claude/task-002`; uncommitted doc edits in tree; D-12; C6 sign-off; frontend gitlink; `000-task-example` numbering |

---

## TO DO

Each row: ClickUp task (full mini-goals as checklist inside), 06 section, plan doc.

### Phase B — Data contract
| ID | Task | ClickUp | Depends on | Blocks | Plan doc |
|---|---|---|---|---|---|
| 003 | Types and seed (**in progress: see above**) | [z8r3fdg7gr](https://app.clickup.com/t/z8r3fdg7gr) | 001, 002 | 008, 009 | `todo-task-003-types-and-seed.md` |

### Phase C — Frontend foundation
| ID | Task | ClickUp | Depends on | Blocks | Plan doc |
|---|---|---|---|---|---|
| 004 | Conform frontend scaffold (**done, see above**) | [z8r3fdg7gt](https://app.clickup.com/t/z8r3fdg7gt) | 000 | 005, 006 | `todo-task-004-frontend-scaffold.md` |
| 005 | Design system | [z8r3fdg7gu](https://app.clickup.com/t/z8r3fdg7gu) | 004 | 008 | `todo-task-005-design-system.md` |
| 006 | Entities kernel | [z8r3fdg7gv](https://app.clickup.com/t/z8r3fdg7gv) | 004 | 007, 008 | `todo-task-006-entities-kernel.md` |
| 007 | Sync kernel | [z8r3fdg7gw](https://app.clickup.com/t/z8r3fdg7gw) | 006 | 015, 016 | `todo-task-007-sync-kernel.md` |

### Phase D — Frontend features
| ID | Task | ClickUp | Depends on | Blocks | Plan doc |
|---|---|---|---|---|---|
| 008 | Auth and workspace shell | [z8r3fdg7gx](https://app.clickup.com/t/z8r3fdg7gx) | 002, 003, 005, 006 | 009 | `todo-task-008-auth-and-workspace-shell.md` |
| 009 | PDF canvas | [z8r3fdg7gy](https://app.clickup.com/t/z8r3fdg7gy) | 008 | 010, 011 | `todo-task-009-pdf-canvas.md` |
| 010 | Text highlight | [z8r3fdg7gz](https://app.clickup.com/t/z8r3fdg7gz) | 009 | 012, 013 | `todo-task-010-text-highlight.md` |
| 011 | Region highlight and OCR | [z8r3fdg7h0](https://app.clickup.com/t/z8r3fdg7h0) | 009 | 021 | `todo-task-011-region-highlight-and-ocr.md` |
| 012 | Notes and handwriting | [z8r3fdg7h1](https://app.clickup.com/t/z8r3fdg7h1) | 010 | 013, 024 | `todo-task-012-notes-and-handwriting.md` |
| 013 | Sheets and promotion | [z8r3fdg7h2](https://app.clickup.com/t/z8r3fdg7h2) | 012 | 014 | `todo-task-013-sheets-and-promotion.md` |
| 014 | Result UI against stub | [z8r3fdg7h3](https://app.clickup.com/t/z8r3fdg7h3) | 013 | 020 | `todo-task-014-result-ui-against-stub.md` |
| 015 | Realtime presence | [z8r3fdg7h4](https://app.clickup.com/t/z8r3fdg7h4) | 007 | 023 | `todo-task-015-realtime-presence.md` |
| 016 | Offline and export | [z8r3fdg7h5](https://app.clickup.com/t/z8r3fdg7h5) | 007 | 023 | `todo-task-016-offline-and-export.md` |

### Phase E — Backend
| ID | Task | ClickUp | Depends on | Blocks | Plan doc |
|---|---|---|---|---|---|
| 017 | Command endpoints | [z8r3fdg7h6](https://app.clickup.com/t/z8r3fdg7h6) | 001 | 018 | `todo-task-017-command-endpoints.md` |
| 018 | LLM adapter (**blocked on D-12**) | [z8r3fdg7h7](https://app.clickup.com/t/z8r3fdg7h7) | 017 | 019, 020 | `todo-task-018-llm-adapter.md` |
| 019 | Mini-conclusion | [z8r3fdg7h8](https://app.clickup.com/t/z8r3fdg7h8) | 018 | 020 | `todo-task-019-mini-conclusion.md` |
| 020 | Result engine | [z8r3fdg7h9](https://app.clickup.com/t/z8r3fdg7h9) | 014, 019 | 023 | `todo-task-020-result-engine.md` |
| 021 | Leader import | [z8r3fdg7ha](https://app.clickup.com/t/z8r3fdg7ha) | 010, 011 | — | `todo-task-021-leader-import.md` |

### Phase F — Hardening
| ID | Task | ClickUp | Depends on | Blocks | Plan doc |
|---|---|---|---|---|---|
| 022 | Responsive, motion, theme | [z8r3fdg7hc](https://app.clickup.com/t/z8r3fdg7hc) | — | — | `todo-task-022-responsive-motion-theme.md` |
| 023 | Pilot hardening | [z8r3fdg7hd](https://app.clickup.com/t/z8r3fdg7hd) | 015, 016, 020 | — | `todo-task-023-pilot-hardening.md` |
| 024 | Ink fallback (**conditional on 012 g6**) | [z8r3fdg7he](https://app.clickup.com/t/z8r3fdg7he) | 012 | — | `todo-task-024-ink-fallback.md` |

---

## Open decisions / blockers

- **D-12** — free-tier training terms vs Perhutani document sensitivity. Gates 018, provider choice and 003 g3 (held).
- **003 g1** — unblocked by 004's `src/`; reopen 003 to do it.
- **C6** — human sign-off from the task-000 split (C7 already resolved: plan id = folder id).
- Replace the `frontend-thinkboard-lite` gitlink in the root repo so its files are tracked (owner call).
- `agent-history/000-task-example/` numbering (owner call).
- 008 needs an add-member definer RPC (`team_members` is client read-only).
- Optional: re-run package C's cold-agent placement check with a fresh agent.

See `notion.md` for the historical log and `notion-clickup-procedure-work.md` for how to keep this board and Notion in sync.
