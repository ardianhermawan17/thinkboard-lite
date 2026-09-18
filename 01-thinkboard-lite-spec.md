---
doc_id: thinkboard-lite-spec
title: ThinkBoard Lite — consolidated spec
version: "2.1"
status: proposed
supersedes: ["10-abstract-plan-superseded.md rev 1", "10-abstract-plan-superseded.md rev 2"]
read_order_position: 1
authority: "Product intent for Lite. Process stays in 07-agent-working.md. Product intent for Full stays in 00-thinkboard-abstract-plan.md."
companion_artifacts:
  - thinkboard-lite-mechanisms.html   # interactive — RLS visibility, broadcast pipeline, outbox
  - thinkboard-lite-visual-rev2.html  # static — connection model, layers, offline, slug chain
  - thinkboard-lite-visual.html       # static — the core loop and the Full→Lite delta
---

# 01 — ThinkBoard Lite spec (rev 2.1)

**One sentence.** A shared PDF workspace where every highlight is a focus point, every focus point
carries notes (typed or handwritten), and the workspace produces two LLM-written conclusions — a private
one per member and a curated one for the team — running collaboratively by default and continuing to work
with the network off.

---

## 0. How an agent should read this file

| | |
|---|---|
| **Normative** | §3 rules, §6 schema, §9 backlog, §10 decisions. Implement exactly. |
| **Explanatory** | §1, §2, §5, §11. Context for *why*; do not treat as requirements. |
| **On conflict** | `thinkboard-schema-final.sql` wins on schema shape. `07-agent-working.md` wins on process. This file wins on Lite product intent. `00-thinkboard-abstract-plan.md` wins on Full product intent. |
| **Rules** | Every invariant has an id `RULE-nn`. Cite the id in `analyze.json.acceptance_criteria` and `validate.json.cross_check_against_plan` rather than paraphrasing. |
| **Decisions** | Every open choice has an id `D-nn` with a default already taken. A task that depends on one must list it in `analyze.json.open_questions`. |
| **Do not** | Invent tables, endpoints or packages not listed here. If something seems missing, it is a decision to raise, not a gap to fill. |

---

## 1. The loop

```
1. CAPTURE     highlight a region or a text span on the workspace PDF   → focus point
2. STRENGTHEN  attach a note — keyboard or stylus                       → evidence
3. DISTIL      one cheap model call per focus point                     → mini result
4. CONCLUDE    mini results + notes + persona + goal                    → Individual | Group result
```

Two axes cut across all four moves and account for most of the complexity in this document:
**whose layer is this on** (§5.1) and **is the network there** (§5.3).

Lite is a **subset** of ThinkBoard Full, not a second product. It runs 3 of Full's 7 pipeline stages
(`scope_anchor` → `analytic` → `result`) against the same database, with no Go gateway and no
service-role key. The test for any Lite decision: *does it create a row, a package or a route that Full
would have had to delete?* If yes, the decision is wrong.

---

## 2. Glossary → schema map

The single most useful table in this file. Lite introduces **one** new user-facing noun (Workspace) and
**one** new table (`highlight_notes`). Everything else already exists.

| Lite noun | Lives in | Notes |
|---|---|---|
| **Workspace** | `teams` + `boards` + `board_columns` + `sessions`, one row each | the board layer is hidden in Lite's UI; Full's kanban turns on with no migration |
| Workspace goal | `sessions.initial_question` | plus `memory_entries scope='initial'` for ideas / limitations |
| Workspace persona | `team_personas` | `team_personas_one_active` already enforces one per team |
| Leader | `team_members.role='leader'` | `team_members_one_leader` already enforces one; **chosen by the workspace creator** |
| Member persona | `user_personas` owned by a profile | Lite convention: one active per person (§6) |
| The document | `artifacts kind='pdf' slot='main'` | bytes in Supabase Storage via `storage_path` |
| Leader's imported annotated copy | `artifacts slot='note'` | §5.4; `artifacts_one_per_slot` enforces one of each |
| **Focus point / highlight** | `highlights` | geometry in `bbox` jsonb; `layer` + `shared_at` added by Lite |
| **Note** | `highlight_notes` | **the only new table**; `visibility`, `input_mode`, `ink`, `version` |
| Group minutes (notulen) | `memory_entries scope='group'` | leader-authored, free-form, not tied to a highlight |
| Mini result | `mini_conclusions` | already 1:1 with a highlight |
| **Result** | `pipeline_runs` → `points` → `point_conclusions` → `run_renderings` | `owner_profile_id` null = group, set = that member's |
| Temperature | `point_conclusions.temperature` | computed by rule (§5.5), not emitted by the model |

---

## 3. Invariants

Numbered so they can be cited, tested and cross-checked. These are the things that, if violated, make
some later part of the system wrong.

### Security and data flow

- **RULE-01** — No service-role key exists anywhere in Lite. Every query runs under the user's JWT.
  A feature that appears to need one is a missing RLS policy.
- **RULE-02** — One write path: HTTPS → PostgREST. Never write over the WebSocket.
- **RULE-03** — A broadcast payload is only as private as its topic. Never publish row data to a topic
  whose membership is coarser than that row's own policy.
- **RULE-04** — `layer='group'` is leader-write. `layer='individual'` is author-write. Nothing in Lite is
  co-edited, therefore Lite contains no CRDT, OT or merge library.
- **RULE-05** — Promotion (`shared_at`) is the author's act, never the leader's, and is atomic over the
  highlight and its note.
- **RULE-06** — Results are snapshots. Unsharing a note hides it going forward; it does not retract a
  Result that already ran.

### Local-first

- **RULE-07** — The network is never on the read path. Every read comes from the local store.
- **RULE-08** — Every write is a row plus an outbox entry inside **one** local transaction.
- **RULE-09** — Row ids are client-generated UUIDv7. All inserts are upserts on `id`
  (`ignoreDuplicates: true`), so any replay is a no-op.
- **RULE-10** — The outbox drains strictly in `seq` order.
- **RULE-11** — Updates coalesce per row: at most one pending update per row at any time.
- **RULE-12** — Network and 5xx → exponential backoff and retry. 4xx → park the op as `failed` and
  surface it. Never retry a permission error forever.
- **RULE-13** — Reconnect order is **push → pull → resubscribe**, never any other.
- **RULE-14** — Opening the app offline must not require a token refresh.
- **RULE-15** — On conflict, keep the local text as a second note. Never discard something a person typed.

### Capture and rendering

- **RULE-16** — Highlight geometry is immutable: created or deleted, never edited in place.
- **RULE-17** — Coordinates are stored page-relative and normalized. Never viewport pixels.
- **RULE-18** — Ink is the record; the transcript is derived and editable. Never destroy strokes.
- **RULE-19** — OCR is the last rung of the detection ladder and runs on crops only, never whole pages.
- **RULE-20** — Cursors and presence never enter React state. Refs plus an imperative Konva layer.

### Structure (carried from `03-backend-folder-architecture.md`)

- **RULE-21** — A new pipeline stage is one file in `stages/` + one registry entry + one transition test.
  Nothing else.
- **RULE-22** — Route handlers bind, call one service method, map the error. No business rules in `app/api/`.
- **RULE-23** — Before adding an endpoint, check whether the client can read it through RLS. If it can, don't.
- **RULE-24** — `llm/` is the only module that resolves or sees an API key. It takes a `profileId`.
- **RULE-25** — On markdown import, the `<!-- tb … -->` comment is the sole identity anchor. A section
  without one imports as a new unanchored note; it is never guessed at or dropped silently.

---

## 4. Architecture

### 4.1 Runtime

```
Browser (Next.js, PWA)
 ├── writes ──── HTTPS ───▶ PostgREST + RLS ──▶ Postgres
 ├── listens ─── WebSocket ▶ Realtime          ◀── trigger: realtime.broadcast_changes()
 ├── local ───── IndexedDB (rows) + OPFS (PDF bytes) + localStorage (4 keys)
 └── server ──── apps/web/src/server/**  (4 endpoints, user JWT only)
```

No Go gateway. No service-role key. Four server endpoints; everything else is client → Supabase under RLS.

### 4.2 Folder map

Named so the later port to Go is a move, not a rewrite:

```
apps/web/src/
├── app/
│   ├── w/[workspaceId]/page.tsx      # client component, no SSR data dependency
│   └── api/v1/…                      # mirrors the gateway's /v1/*
├── features/                          # Full §9 convention: index / <name>.tsx / ui.tsx / use-<name>.ts / .types.ts
│   ├── workspace/  pdf-canvas/  highlight/  notes/  result/  presence/  offline/
└── server/                            ⇄  services/gateway/internal/   (Full)
    ├── pipeline/{service,stages/registry,stages/*,temperature}.ts   ⇄ pipeline/
    ├── llm/{service,providers/*,resolver,vault,usage,ratelimit}.ts  ⇄ llm/
    ├── memory/                                                      ⇄ memory/
    ├── ocr/                                                         (client-only; no Go counterpart)
    └── db/                                                          ⇄ platform/postgres/
```

### 4.3 API surface — complete

| Method | Route | Note |
|---|---|---|
| `POST` | `/api/v1/workspaces` | creates team + board + column + session + persona + leader in one transaction |
| `POST` | `/api/v1/highlights/:id/mini-conclusion` | idempotent; skips when notes are unchanged |
| `POST` | `/api/v1/workspaces/:id/results` | `{ scope: 'individual' \| 'group' }`; group → 403 unless leader |
| `GET` | `/api/v1/runs/:id/stream` | SSE; `ReadableStream`, no compression on this route |

Everything else — highlights, notes, promotion, members, artifacts, presence — goes client → Supabase.
Promotion is an RPC (`promote_highlight`, §6), not an endpoint.

---

## 5. The mechanisms

### 5.1 Visibility: private → promoted → group

Three states, one timestamp. **Interactive walkthrough: `thinkboard-lite-mechanisms.html` §01.**

| `layer` | `shared_at` | Who can select | Who can write |
|---|---|---|---|
| `individual` | `null` | the author only | the author |
| `individual` | set | everyone in the workspace | still the author |
| `group` | — | everyone in the workspace | the leader only |

Privacy is enforced by RLS, not by application filtering: a teammate's `select * from highlights`
**cannot return** a private row. An app bug cannot leak what the query never received.

**Why promotion exists.** `individual = private` and `group = leader-only write` together would mean a
member's thinking never reaches the Group Result — the leader cannot read private notes and members cannot
write group ones. Promotion is the bridge, and it stays the author's decision (RULE-05).

**The leader copies nothing.** The Group Result reads `layer = 'group' OR shared_at is not null`. Pulling
a note across is the leader optionally re-marking it for emphasis — no copy table, no link column, no two
versions of one thought drifting apart.

**Not in v1:** leader-hide of a promoted note. If a promoted note is wrong, the leader says so in the
minutes. A censorship control is a social feature with social consequences and is not needed to ship.

### 5.2 Transport: writes out, changes back

**Interactive walkthrough: `thinkboard-lite-mechanisms.html` §02.**

| Traffic | Transport | Why |
|---|---|---|
| Durable write | HTTPS → PostgREST, RLS-checked, transactional | must survive a dropped socket and pass the single authorization path |
| Durable change, fanned out | Realtime **Broadcast from Database** | the trigger fires after the row commits, so a screen can never show a write that rolled back |
| Cursors, "leader is drawing", page position | Realtime **Broadcast**, throttled ~20 Hz | ephemeral; never touches Postgres |
| Who is here | Realtime **Presence** | self-cleaning on disconnect |

One socket per client. The TLS handshake happens once at socket open; after that it is frames, and REST
writes ride a reused HTTP/2 connection to the same origin.

**What "Broadcast from Database" is.** A Broadcast message whose sender is Postgres rather than a client:
a trigger calls `realtime.broadcast_changes()`, which inserts into `realtime.messages`; Realtime tails
*that* table's WAL and pushes to the named topic. Messages are deleted after three days — it is a
notification channel, not a log. Durable state is the `highlights` table; the broadcast only says
"look again".

**Why not Postgres Changes.** It authorizes every event against every subscriber — one insert with 100
watchers is 100 checks — and runs on a single ordering thread that a larger compute does not speed up.
Broadcast authorizes once at channel join and caches. Both work for a six-person workspace; only one keeps
working. Setup cost is one trigger and one policy either way.

**Two topics, not one.** Each client subscribes to `ws:{sessionId}` **and** `user:{profileId}`. The
trigger decides which topic a row goes to (§6). This is RULE-03 made concrete — the topic policy only asks
"are you in this workspace", so a single-topic trigger would push private rows to everyone while the table
itself stayed correctly locked.

**Client detail that breaks silently:** private channels require `supabase.realtime.setAuth()` before
subscribing, and again after **every** token refresh. Miss the second and delivery stops without an error.

### 5.3 Local-first and offline

**Interactive walkthrough: `thinkboard-lite-mechanisms.html` §03.**

**Offline is a capture mode, not a thinking mode.** Available: open the document, highlight, write notes,
read your own notes and the last-synced group layer, export the bundle. Unavailable: presence, live
updates, group writes, mini-conclusions, Results, transcription above tier 0. Say so in the UI.

**Sequencing, and this is the important part:** build the local-first data layer at **task 002**, not
task 010. If every read and write goes through a local repository from the first highlight, offline mode
is *stop syncing and hide the group layer*. Added at the end it means rewriting the data layer, the
optimistic updates and the error handling at once.

**Storage tiers**

| Tier | Holds | Why |
|---|---|---|
| `localStorage` | Supabase session, theme, last workspace id, `mode` | synchronous, ~5 MB, strings only — right for four keys, wrong for anything else |
| **IndexedDB** (Dexie) | every row + the outbox + meta | async, indexed, structured, large quota |
| **OPFS** | PDF bytes, one file per artifact | a 40 MB document wants streaming file reads, not a blob row |

Call `navigator.storage.persist()` on first offline open, or the browser may evict the PDF under storage
pressure. **Never stored locally:** other people's private rows (automatic — RLS never returned them),
LLM keys, and by default the group document's bytes (D-10).

```ts
db.version(1).stores({
  meta:            'key',                                 // workspace, goal, persona, lastSyncedAt
  artifacts:       'id, sessionId',                       // metadata only; bytes in OPFS
  highlights:      'id, artifactId, page, layer, _dirty',
  notes:           'id, highlightId, profileId, _dirty',
  miniConclusions: 'highlightId',
  outbox:          '++seq, rowId, table',
})
```

**State flow** — the network is never on the read path (RULE-07):

```
components → TanStack Query (queryFn reads Dexie, never fetch) → Repository (only module touching Dexie) → Dexie
                                    ▲
                            Sync engine (only module touching Supabase)
                            ├── push: drains the outbox
                            └── pull: realtime events + reconnect reconcile → writes into Dexie
```

Two consequences: optimistic updates stop being a concept you implement (you wrote to the local database
and the UI renders the local database), and an incoming realtime event takes the same path as your own pen
— one rendering path to debug.

| State | Home |
|---|---|
| Durable data | Dexie via TanStack Query |
| Sync status (`mode`, `pendingCount`, `lastSyncedAt`, `syncError`) | Zustand |
| Ephemeral UI (selected highlight, open sheet, active tool, zoom) | Zustand |
| Shareable view (`?h=…&sheet=result`) | the URL |
| Cursors and presence | a `useRef` map + imperative Konva layer (RULE-20) |

**Outbox**

```ts
interface OutboxOp {
  seq: number      // ++autoincrement — drain order, and it matters
  rowId: string    // uuidv7, client-generated
  table: 'highlights' | 'notes'
  op: 'insert' | 'update' | 'delete'
  payload: Record<string, unknown>
  attempts: number
  lastError?: string
}
```

Governed by RULE-10 through RULE-12. Delete an op only after the server confirms.

**Reconnect.** Push, then pull, then resubscribe (RULE-13). For the pull, diff a manifest rather than
keeping tombstones:

```sql
select id, updated_at from highlights where artifact_id = $1;
```

Ids newer on the server → fetch those rows. Ids in Dexie the server did not return and that are not
`_dirty` → delete locally. A few KB for a few hundred highlights, and it catches deletes — which an
`updated_at > lastSynced` query never will. This requires `highlights.updated_at`, added in §6.

**Mode switch.** `mode` persists in `localStorage`. Manual *Work offline* is authoritative;
`navigator.onLine` plus a heartbeat may **degrade** into offline automatically but never silently exits
it — reconnecting shows "Back online · 12 changes to sync" with a button.

**Dark mode.** `next-themes` with shadcn's `class` strategy. Konva does not inherit CSS variables: pass
theme colours into the stage explicitly and redraw the layer on change. Do not darken highlight colours in
dark mode — darken the page, keep the hue, drop the alpha.

### 5.4 Capture, input and import

**Highlight capture, two layers per page.**

| Layer | Tech | Produces |
|---|---|---|
| Text layer (DOM, PDF.js) | Selection/Range API → client rects | `extraction='text_layer'`, exact string, `confidence = 1.0` |
| Ink/region (Konva stage per page) | stylus stroke, marquee rect | `extraction='ocr'`, crop → Tesseract → `confidence` |

**Pushback on record:** a *document* canvas with Figma feel (pan, pinch-zoom, floating toolbar, presence
cursors), not an infinite board. Real text selection needs the PDF.js text layer, which is DOM; putting
the page inside a canvas scene turns text into pixels and forces you to OCR words that were already
perfect.

**Note input.** `input_mode ∈ {keyboard, ink}`. Keyboard is a plain `textarea` with markdown preview and a
2,000-character cap — not a rich-text editor. Ink is a shadcn `Dialog` (desktop) / `Sheet side="bottom"`
(tablet) holding a Konva pad with two faint baselines, capturing `{x, y, t, pressure}` per point.

**Transcription ladder** (RULE-18 governs the result):

| Tier | Path | Availability |
|---|---|---|
| 0 | `navigator.createHandwritingRecognizer()` | free, local, works offline — narrow browser support; feature-detect, treat as a bonus |
| 1 | rasterized ink crop → the vision-capable free-tier model already in use | **the default** |
| 2 | MyScript `iinkJS` | best accuracy, free monthly quota, second third-party data egress |

Never rasterize ink and hand it to Tesseract: on-line recognition beats OCR precisely because it has the
stroke sequence and pressure, and rasterizing discards them. Offline, only tier 0 exists — ink notes save
as ink and queue a `transcribe` job for reconnect.

**Leader import of an already-highlighted PDF** — a ladder, OCR last (RULE-19):

| Rung | Case | Method | Accuracy |
|---|---|---|---|
| 1 | real PDF annotations (Acrobat, Preview, Notability, GoodNotes) | `page.getAnnotations()` → `subtype === 'Highlight'` → `QuadPoints` | exact; with a text layer, intersect quads with text items and skip OCR entirely |
| 2 | highlight flattened in, text layer present | rasterize → colour mask → boxes → intersect with text items | exact |
| 3 | scan of paper + physical marker | colour mask → crop → Tesseract on the crop | `extraction='ocr'`, confidence-gated at 0.70 |

Build rung 1 first; it is the common case and costs almost nothing. PDF rects are bottom-left origin,
Y-up — every one goes through `viewport.convertToViewportRectangle()`. A QuadPoints array is 8 numbers per
quad; flatten a multi-line highlight into one highlight with several rects.

Colour mask: HSV, keep S > 0.35 and V > 0.55 in the highlighter hue bands (yellow 40–70°, green 70–160°,
cyan 160–200°, pink 290–340°); dilate 3px, erode 2px; connected components; drop < 8px tall or < 20px
wide; merge components with > 60% vertical overlap into line boxes. Runs in a Worker. **Always show a
review screen before committing** — a colour mask fires on charts, logos and coloured table headers.

Each detected region becomes a `layer='group'` highlight with an empty note and a slug.

### 5.5 Results and temperature

| | Individual | Group |
|---|---|---|
| Who runs it | any member, for themselves | leader only |
| Notes | that member's `visibility='individual'` notes | all `visibility='group'` notes + the leader's minutes |
| Persona | that member's `user_personas` row | the workspace `team_personas` row |
| Row | `owner_profile_id = <profile>` | `owner_profile_id = null` |

Prompt order inherited from Full: **goal → persona → notes → mini-conclusions → output contract**. Group
runs apply the workspace persona as a constraint layer after the content.

**Temperature is computed, not generated.** With no Research/Validation/Questioning stage, a model-emitted
confidence number is decoration:

```
temperature = clamp(
    0.30                                      # base
  + 0.15 * (notes_attached >= 1)
  + 0.10 * min(distinct_note_authors - 1, 2)  # corroboration, capped
  + 0.15 * (extraction == 'text_layer')       # exact text beats OCR
  + 0.10 * (has_limitation_note)
  + 0.10 * (highlight.weight > 1.0)
, 0, 1)
```

Explainable in one tooltip, and stores unchanged in the existing `numeric(3,2)` column.

### 5.6 Export and traceability

One zip, three files, **one id**:

```
workspace-{slug}-{yyyymmdd}.zip
├── document.pdf      original bytes + /Highlight annotations appended, /NM = slug
├── notes.md          one section per focus point, with an HTML-comment anchor
├── thinkboard.json   lossless: rects, strokes, personas, goal, schema version
└── ink/{slug}.svg    handwritten notes, as drawn
```

Slug: `h-p{page:02}-{order:02}-{6}`, the last part base32 of a hash over normalized text + quantized rect
— e.g. `h-p03-07-k4m2xq`. Deterministic, so re-importing the same document dedupes.

```md
## p.3 · Cost basis is stated in 2023 prices
<!-- tb id=h-p03-07-k4m2xq page=3 rect=0.118,0.412,0.784,0.437 layer=individual extraction=text_layer -->

> Cost basis is stated in 2023 prices and not adjusted for the revised tariff.

Kalau pakai angka 2023, selisihnya bisa 12%. Perlu cek ke lampiran B.
```

Import obeys RULE-25. Keep the original PDF bytes and **append** annotations — never re-render a page, or
the text layer everything depends on is destroyed.

---

## 6. Schema delta — `0004_lite.sql` (final)

> **Superseded 2026-09-18 by `02-database-architecture.md` §8.1.** Implement from there. It applies C6
> (`note_input_mode` has three values) and the review fixes DB-F2 – DB-F10. This section stays as the record.

One new table, six new columns, two replaced policies, three triggers. **The two policy drops are the
only non-additive change in the entire plan.**

```sql
-- ── enums ───────────────────────────────────────────────────────────────
create type note_visibility  as enum ('individual','group');
create type note_input_mode  as enum ('keyboard','ink');
create type highlight_layer  as enum ('individual','group');

-- ── highlights: layer, promotion, slug, updated_at ──────────────────────
alter table highlights add column layer      highlight_layer not null default 'individual';
alter table highlights add column shared_at  timestamptz;              -- null = private
alter table highlights add column slug       text;
alter table highlights add column updated_at timestamptz not null default now();
create unique index highlights_slug_idx   on highlights (artifact_id, slug) where slug is not null;
create index        highlights_layer_idx  on highlights (artifact_id, layer);
create index        highlights_shared_idx on highlights (artifact_id) where shared_at is not null;

-- ── notes: the one new table ────────────────────────────────────────────
create table highlight_notes (
  id             uuid primary key default gen_random_uuid(),   -- client supplies uuidv7
  highlight_id   uuid not null references highlights(id) on delete cascade,
  profile_id     uuid not null references profiles(id)   on delete cascade,
  visibility     note_visibility  not null default 'individual',
  input_mode     note_input_mode  not null default 'keyboard',
  content        text not null default '',
  ink            jsonb,                                        -- strokes when input_mode='ink'
  transcribed_at timestamptz,
  version        int  not null default 1,                      -- optimistic concurrency
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index highlight_notes_highlight_idx on highlight_notes (highlight_id, visibility);
create index highlight_notes_profile_idx   on highlight_notes (profile_id);

-- ── pipeline: trace a point, and whose result this is ───────────────────
alter table points        add column highlight_id     uuid references highlights(id) on delete set null;
alter table pipeline_runs add column owner_profile_id uuid references profiles(id)   on delete set null;
create index points_highlight_idx    on points (highlight_id);
create index pipeline_runs_owner_idx on pipeline_runs (session_id, owner_profile_id);

-- ── helper: is the caller the leader of this session's team ─────────────
create or replace function can_lead_session(target_session uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sessions s
    join board_columns c on c.id = s.column_id
    join boards b        on b.id = c.board_id
    where s.id = target_session and is_team_leader(b.team_id));
$$;

-- ⚠️ NON-ADDITIVE: the existing policies are workspace-wide and make private
--    highlights impossible. Both are replaced.
drop policy "artifact highlights"   on highlights;
drop policy "highlight conclusions" on mini_conclusions;

create policy "private highlights" on highlights for all
  using      (layer = 'individual' and profile_id = current_profile_id())
  with check (layer = 'individual' and profile_id = current_profile_id());

create policy "promoted highlights read" on highlights for select
  using (layer = 'individual' and shared_at is not null and exists (
    select 1 from artifacts a where a.id = artifact_id and can_access_session(a.session_id)));

create policy "group highlights read" on highlights for select
  using (layer = 'group' and exists (
    select 1 from artifacts a where a.id = artifact_id and can_access_session(a.session_id)));

create policy "leader writes group highlights" on highlights for all
  using      (layer = 'group' and exists (
    select 1 from artifacts a where a.id = artifact_id and can_lead_session(a.session_id)))
  with check (layer = 'group' and exists (
    select 1 from artifacts a where a.id = artifact_id and can_lead_session(a.session_id)));

-- a mini-conclusion is visible only if its highlight is
create policy "highlight conclusions" on mini_conclusions for all using (exists (
  select 1 from highlights h join artifacts a on a.id = h.artifact_id
  where h.id = highlight_id
    and can_access_session(a.session_id)
    and (h.layer = 'group' or h.shared_at is not null or h.profile_id = current_profile_id())));

-- ── notes RLS ───────────────────────────────────────────────────────────
alter table highlight_notes enable row level security;
create policy "read notes" on highlight_notes for select using (
  profile_id = current_profile_id()
  or (visibility = 'group' and exists (
        select 1 from highlights h join artifacts a on a.id = h.artifact_id
        where h.id = highlight_id and can_access_session(a.session_id))));
create policy "write own notes" on highlight_notes for all
  using (profile_id = current_profile_id()) with check (profile_id = current_profile_id());

-- ── promotion: atomic over highlight + note (RULE-05) ───────────────────
create or replace function promote_highlight(p_highlight uuid, p_note uuid default null)
returns highlights
language plpgsql security invoker as $$        -- invoker: RLS still guards it
declare h highlights;
begin
  update highlights set shared_at = now(), updated_at = now()
   where id = p_highlight
     and profile_id = current_profile_id()
     and layer = 'individual'
   returning * into h;
  if not found then raise exception 'not yours to share'; end if;

  update highlight_notes
     set visibility = 'group', updated_at = now(), version = version + 1
   where highlight_id = p_highlight
     and profile_id = current_profile_id()
     and (p_note is null or id = p_note);
  return h;
end $$;

-- ── touch triggers (reconnect reconciliation depends on updated_at) ─────
create or replace function tb_touch() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

create trigger highlights_touch      before update on highlights
  for each row execute function tb_touch();
create trigger highlight_notes_touch before update on highlight_notes
  for each row execute function tb_touch();

-- ── realtime: two topics, chosen per row (RULE-03) ──────────────────────
create or replace function tb_broadcast_highlight() returns trigger
language plpgsql security definer set search_path = public as $$
declare r highlights; topic text; sid uuid;
begin
  r := coalesce(new, old);
  select a.session_id into sid from artifacts a where a.id = r.artifact_id;
  if r.layer = 'group' or r.shared_at is not null then
    topic := 'ws:'   || sid::text;               -- everyone in the workspace
  else
    topic := 'user:' || r.profile_id::text;      -- only the author's other devices
  end if;
  perform realtime.broadcast_changes(
    topic, tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  return null;
end $$;

create or replace function tb_broadcast_note() returns trigger
language plpgsql security definer set search_path = public as $$
declare r highlight_notes; topic text; sid uuid;
begin
  r := coalesce(new, old);
  select a.session_id into sid
    from highlights h join artifacts a on a.id = h.artifact_id
   where h.id = r.highlight_id;
  if r.visibility = 'group' then
    topic := 'ws:'   || sid::text;
  else
    topic := 'user:' || r.profile_id::text;
  end if;
  perform realtime.broadcast_changes(
    topic, tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  return null;
end $$;

create trigger highlights_broadcast      after insert or update or delete on highlights
  for each row execute function tb_broadcast_highlight();
create trigger highlight_notes_broadcast after insert or update or delete on highlight_notes
  for each row execute function tb_broadcast_note();

-- ── realtime authorization: both topics ─────────────────────────────────
create policy "members listen to their workspace" on realtime.messages
  for select to authenticated using (
    realtime.messages.extension = 'broadcast'
    and exists (
      select 1 from sessions s
      join board_columns c on c.id = s.column_id
      join boards b        on b.id = c.board_id
      where realtime.topic() = 'ws:' || s.id::text
        and is_team_member(b.team_id)));

create policy "listen to own device topic" on realtime.messages
  for select to authenticated using (
    realtime.messages.extension = 'broadcast'
    and realtime.topic() = 'user:' || current_profile_id()::text);

-- ── misc ────────────────────────────────────────────────────────────────
create policy "own llm usage insert" on llm_requests for insert
  with check (profile_id = current_profile_id());

create unique index user_personas_one_active_per_owner
  on user_personas (owner_profile_id) where is_active and owner_profile_id is not null;
```

**Deliberately unchanged:** `highlights.bbox` absorbs all geometry (no x/y/w/h, no colour column);
`highlights.extraction` already splits text-layer from OCR; `mini_conclusions` is already the
per-highlight mini result; `artifacts_one_per_slot`, `team_members_one_leader` and
`team_personas_one_active` already enforce three product rules; the `pipeline_stage` enum is untouched.

> Note for `CLAUDE.md`: Supabase is deprecating the `anon` and `service_role` keys by the end of 2026 in
> favour of publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys. `0003_grant_schema.sql` and
> the repo docs still use the old names.

---

## 7. LLM routing

**Default from the registered email, user-overridable.**

| `profile_identities.kind` | Default route | Override |
|---|---|---|
| `internal` | institutional shared pool | may supply a personal key |
| `individual` | free-tier shared pool | may supply a personal key |

`llm_requests.key_source ∈ {user, shared}` records which route a call took. Key resolution lives in
`apps/web/src/server/llm/vault.ts` and nowhere else (RULE-24) — Full's rule survives; only the component
identity changes. No route returns a key; the browser never sees one. Validate on save with one cheap test
call, then write `last_validated_at` / `status`.

**Call budget** — a 40-highlight workspace costs ~42 model calls, not 40 × 7 stages. Mini-conclusions are
cached on `(highlight.text, notes_hash, persona_id)`; the Result call batches all mini-conclusions into
one prompt. Free tiers bind on requests-per-day long before tokens. Build the provider adapter for
rotation with 429 failover, not for a single provider.

🚩 **Answer before choosing a provider:** most no-card free tiers fund themselves with your prompts —
Google uses free-tier prompts to improve its models outside the EU/UK/EEA, and Mistral's Experiment tier
requires opting into training. For Perhutani documents this may be disqualifying on its own, and tier-1
handwriting transcription sends ink images down the same pipe. The adapter makes it a budget decision
rather than an architecture one.

---

## 8. Feature coverage index

Every requested item, and where it is answered. Use this to verify nothing was dropped.

| From | Feature | Section |
|---|---|---|
| v1 · 1,2 | canvas highlighting; each highlight is a focus point | §5.4, RULE-16/17 |
| v1 · 3 | highlight linked to notes | §6 `highlight_notes` |
| v1 · 4,5 | workspace persona; workspace goal | §2 |
| v1 · 6 | per-user persona | §2, §6 index |
| v1 · 7 | individual vs group result | §5.5 |
| v1 · 8 | tablet / desktop / mobile | §10 D-11 device matrix |
| v1 · 9 | motion, next, mermaid, konva, tailwind+shadcn | §12 |
| v1 · 11 | three sheets | §5.1, §5.4 |
| v1 · 12 | Figma-like canvas | §5.4 — **pushback recorded**: document canvas, not infinite board |
| v1 · 13 | OCR an already-highlighted PDF | §5.4 import ladder |
| v1 · 14 | leader notulen / generates result | §5.1, §5.5 |
| v1 · 14b | suggest other libraries | §12 |
| v1 · 15,16 | reference Full; single platform goal | §1, §2 |
| v2 · 1,2 | keyboard vs handwriting; writing dialog | §5.4 |
| v2 · 3 | own API or free tier by email | §7 |
| v2 · 4 | two PDF sheets: private / leader-only group | §5.1 |
| v2 · 5 | leader imports highlighted PDF; traceable slug; md ↔ sheet | §5.4, §5.6, RULE-25 |
| v2 · 6 | creator decides the leader | §2 |
| challenge 1 | how does collaboration connect | §5.2 |
| challenge 2 | API call or active connection | §5.2 — **both, split by data class** |
| challenge 3 | private sheet offline, no SSR | §5.3 |
| modes 1–7 | offline scope, export, auto-note, switches, same UI | §5.3, §5.6 |

---

## 9. Task backlog

Replaces the starting `task_sequence` in `07-agent-working.md` §8 (see D-05). One folder per task under
`agent-history/NNN-task-<slug>/`, one contract under `agent-thinking/todo/NNN-todo-<slug>/`.
In Lite, `architecture: backend` means `apps/web/src/server/**`.

| # | Task | Arch | Proves | Depends |
|---|---|---|---|---|
| 000 | Apply `0001`–`0003`; author and apply `0004_lite.sql` | `supabase` | the §6 delta migrates clean, **including the two dropped policies** | — |
| 001 | Workspace shell: auth, create workspace, creator picks leader, members, personas, goal | `frontend` (sec. `supabase`) | RLS covers the client path | 000 |
| 002 | **Local-first data layer** + PDF render + text-layer highlight capture | `frontend` | coordinates survive zoom/rotate; every write goes through the repository | 001 |
| 003 | Konva ink/region layer + cropped OCR + confidence gate | `frontend` | §5.4 rungs 2–3 | 002 |
| 004 | Notes: keyboard mode, three sheets, private + promote | `frontend` | §5.1 | 002 |
| 005 | Realtime: presence, cursors, two-topic broadcast triggers | `frontend` (sec. `supabase`) | §5.2 with two real browsers | 002 |
| 006 | LLM adapter, key routing, usage accounting, mini-conclusion | `backend` | §7; stubbed provider first | 001 |
| 007 | Result engine: individual + group runs, temperature, renderings | `backend` | §5.5 | 004, 006 |
| 008 | Handwriting pad + transcription ladder | `frontend` (sec. `backend`) | §5.4 tiers 0–1 | 004 |
| 009 | Leader import of an annotated PDF + review screen | `frontend` | §5.4, rung 1 first | 003 |
| 010 | Offline mode: Serwist, OPFS, outbox sync, mode switch | `frontend` | §5.3 — thin, because 002 paid for it | 002, 004 |
| 011 | Export bundle + re-import round trip | `frontend` | §5.6, RULE-25 | 010 |
| 012 | Descriptive markdown + Mermaid visualize | `frontend` | §5.5 | 007 |
| 013 | Responsive matrix, motion pass, dark mode | `frontend` | §5.3, §10 | 004, 012 |
| 014 | Pilot hardening: backoff, queued runs, empty and error states | `backend` (sec. `frontend`) | §7 under real quota | 007 |

**Vertical slice before fan-out:** 000 → 001 → 002 → 006 (stubbed) → 007 gives a demoable
highlight-to-result path. 005 lands early because a transport choice discovered late is expensive; 010
lands late only because 002 already did the hard part.

---

## 10. Decisions

| # | Decision | Default taken |
|---|---|---|
| D-01 | Is "individual" a privacy boundary? | **yes** (changed from rev 1) |
| D-02 | One PDF per workspace, or several? | one `main` + the leader's imported `note` copy |
| D-03 | Who runs the Group Result? | leader only |
| D-04 | One active persona per person? | yes |
| D-05 | Does this backlog replace `07-agent-working.md` §8? | yes, proposed |
| D-06 | Can the leader edit generated minutes in place? | yes, as a draft |
| D-07 | How does a member's thinking reach the Group Result if individual is private? | **explicit promotion via `shared_at`** — §5.1 |
| D-08 | Can the leader hide or delete a promoted note? | neither in v1; the minutes are the answer |
| D-09 | Does leadership transfer? | yes, by the leader or the workspace creator |
| D-10 | Is the group document cached offline? | no, not by default |
| D-11 | Device parity | tablet authors (stylus), desktop analyses, mobile reads and writes notes; no freehand ink on mobile |
| D-12 | Free-tier provider vs. document sensitivity | **unanswered — answer before task 006** |

D-01, D-05, D-07 and D-12 must appear in task 000's / 001's `analyze.json.open_questions`.

---

## 11. Risks

1. **Handwriting accuracy** — no good free offline path. Mitigation is architectural (RULE-18), not technical.
2. **Highlight coordinates across zoom, rotation and re-render** — the hardest engineering problem here. Spike it in task 002.
3. **The RLS rewrite in §6** — write an integration test that signs in as a second member and asserts a private highlight *and its mini-conclusion* are both invisible. Task 000, not later.
4. **Broadcast topic leak** — the same test must assert that a private row never arrives on `ws:{sessionId}`.
5. **Free-tier quota** against a six-person workspace; ink transcription increases call volume.
6. **Free-tier training terms** vs. Perhutani document sensitivity (D-12).
7. **Offline data at rest**, unencrypted on personal devices. Offer *clear local data on sign out*.
8. **Colour-mask false positives** on charts and coloured tables — the review screen is the mitigation.
9. **Serwist is disabled in dev under Turbopack** — service-worker bugs surface only in production builds. Budget a staging environment.

---

## 12. Library set

| Need | Pick | Note |
|---|---|---|
| PDF render + text layer | `pdfjs-dist` | the substrate for everything else |
| Text-highlight plumbing | `react-pdf-highlighter-extended` | viewport-independent highlight format |
| Ink / region / stylus | `konva` + `react-konva` | one overlay layer per page, never the whole viewport |
| Stroke capture reference | `atrament` | model for `{x, y, time, pressure}` per segment |
| OCR | `tesseract.js` | one worker, lazy-loaded, crops only |
| PDF annotation write-back | `annotpdf`; fallback: hand-built dict with `pdf-lib` | check maintenance before committing |
| Zip | `fflate` | JSZip is the heavier alternative |
| Local storage | `dexie` or `idb`, plus OPFS for blobs | |
| Service worker | `@serwist/next` | next-pwa is archived; disabled in dev under Turbopack |
| Realtime | `@supabase/supabase-js` | one socket, two topics |
| Motion | `motion` | do not animate the Konva layer with it |
| Theme | `next-themes` | pass colours into Konva explicitly |
| Diagrams | `mermaid` | generated output only |
| UI | `tailwindcss` + `shadcn/ui` | |

---

## 13. Companion artifacts

Ship these next to this file. They are explanatory, not normative — but they are the fastest way for a
human reviewer to check the design before an agent starts building.

| File | Shows | Interactive |
|---|---|---|
| **`thinkboard-lite-mechanisms.html`** | §01 RLS visibility — switch viewer and watch private rows vanish from the result set, press *Share to group* and watch them appear for others. §02 the broadcast pipeline as a 7-step walkthrough, with a *make the transaction fail* toggle. §03 storage tiers, state flow, and a live outbox showing seq-order drain and update coalescing. | ✅ |
| `thinkboard-lite-visual-rev2.html` | the connection model end to end, the private/promoted/group layers, offline on-and-off matrix, and the slug's three homes (DB row → md anchor → PDF `/NM`) | — |
| `thinkboard-lite-visual.html` | the four-move loop, the Workspace → schema mapping, one-screen anatomy, and the Full → Lite delta | — |

Section mapping for an agent that needs a picture: §5.1 → mechanisms §01 · §5.2 → mechanisms §02 ·
§5.3 → mechanisms §03 · §5.6 → rev2 visual, last panel · §2 → the first visual.

---

## 14. Changelog

**rev 1 → rev 2**
- individual scope changed from authorship-only to **private** (D-01)
- group sheet became **leader-write**; promotion introduced (D-07)
- handwriting input, transcription ladder
- own-key vs free-tier routing un-deferred
- leader import of an annotated PDF
- offline mode; local-first moved to task 002
- schema delta stopped being purely additive (two policies replaced)

**rev 2 → rev 2.1** — three corrections, now folded in
1. The broadcast trigger chooses between `ws:{sessionId}` and `user:{profileId}`. As first written it pushed private rows to the whole workspace while the table itself stayed correctly locked (RULE-03).
2. `highlights.updated_at` + touch triggers added; reconnect reconciliation has nothing to diff without them (RULE-13).
3. `promote_highlight()` added as a `security invoker` RPC, so sharing a highlight and its note can never half-succeed (RULE-05).

---

## 15. Sources

- Supabase Realtime — Postgres Changes scaling, Broadcast recommendation, Broadcast from Database, Realtime Authorization caching, key deprecation
- Handwriting Recognition API (on-line vs off-line recognition, Chromium availability); WICG explainer; MyScript `iinkJS`
- Serwist / next-pwa migration status and the Turbopack constraint
- PDF highlight annotations — QuadPoints structure, `viewport.convertToViewportRectangle()`; `annotpdf`
- Free-tier LLM training terms — OpenRouter free-LLM comparison, costbench free-tier survey
- In repo: `00-thinkboard-abstract-plan.md`, `01-thinkboard-schema-rationale.md`, `07-agent-working.md`, `03-backend-folder-architecture.md`, `08-agent-todo-intake.md`, `09-agent-limitation.md`, `thinkboard-schema-final.sql`
