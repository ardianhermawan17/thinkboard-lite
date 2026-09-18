---
doc_id: thinkboard-lite-abstract-plan
title: ThinkBoard Lite abstract plan, revision 2
status: superseded
superseded_by: "01-thinkboard-lite-spec.md"
read_order_position: 10
---

# 10 — ThinkBoard **Lite** abstract plan, revision 2 (superseded)

> **Superseded** by [`01-thinkboard-lite-spec.md`](01-thinkboard-lite-spec.md). Kept as the record of how the design got here; never cite it as normative.

*A shared PDF workspace. Every highlight is a focus point, every focus point carries notes — typed or
handwritten — and the workspace produces two conclusions: yours (private) and the team's (curated by the
leader). It runs collaboratively by default and keeps working with the network off.*

> Supersedes revision 1. Relationship to **ThinkBoard Full** is unchanged: this is a *subset* of
> `00-thinkboard-abstract-plan.md` + `thinkboard-schema-final.sql` + `03-backend-folder-architecture.md`,
> not a second product. Where Lite differs, §2 and §9 list it explicitly.

---

## 0. What changed in revision 2

| Area | Rev 1 | Rev 2 |
|---|---|---|
| Note input | typed only | **typed or handwritten**; ink is the source of truth, transcript is derived and editable (§5.2) |
| Individual scope | authorship only, workspace-readable | **private by default**, with an explicit *promote to group* action (§4, D7) |
| Group sheet | any member writes group notes | **leader-only write**, members read; members contribute by promoting their own notes (§4) |
| LLM access | shared free-tier pool only | **own key or free tier**, defaulted from the registered email kind (§8) |
| Leader import | not specified | **upload an already-highlighted PDF** → highlights detected → one note per highlight, each with a stable slug (§6) |
| Leader selection | implied | **the workspace creator picks the leader** at creation (§3) |
| Connectivity | online only | **two modes: collaboration (default) and offline**, same UI (§7) |
| Data layer | server-backed | **local-first from task 002**, not offline bolted on at the end (§7.4, §11) |
| Schema delta | additive only | **one policy drop and recreate** — the only non-additive change in the plan (§9) |

Two things worth arguing about before you build, both in §12: the private/group contradiction (D7), and
the fact that most no-card free LLM tiers train on your prompts — which now covers handwriting images too.

---

## 1. Concept

Unchanged. The unit of thought is a mark on a document everyone can see:

```
1. CAPTURE     highlight a region or a text span                → focus point
2. STRENGTHEN  attach a note — keyboard or stylus               → evidence
3. DISTIL      one cheap model call per focus point             → mini result
4. CONCLUDE    mini results + notes + persona + goal            → Individual | Group result
```

Revision 2 adds a second axis to all four moves: **whose layer is this on, and is the network there.**
Most of this document is those two questions.

---

## 2. The delta against ThinkBoard Full

| Full | Lite | Why |
|---|---|---|
| 7 pipeline stages | **3** (`scope_anchor` → `analytic` → `result`) | subset of the same enum; adding the rest means emitting more rows, not migrating |
| Go gateway | **deferred**; server code in `apps/web/src/server/` under the gateway's own package names | Lite has neither 450 users nor 8-hour streams |
| Gateway bypasses RLS → `internal/auth` mirrors every policy | **deleted** — no service-role key anywhere | no bypass, no second copy of the rules |
| Context-warning heuristic | deferred, scope embedding still written | the PDF is the scope anchor |
| 20/80 internet/material | material only | web search is the slowest, most rate-limited leg |
| Vault + BYO key | **un-deferred in rev 2** (§8) | the feature list now requires it |
| Mermaid + React Flow | Mermaid only | Lite's diagrams are generated, never hand-edited |
| Temperature from Research→Validation→Questioning | rule-based from human evidence | with no validation stage, a model-emitted score is decoration |
| Realtime mentioned for kanban/presence | **fully specified** (§7) | it is now the spine of the product, not a nicety |

---

## 3. Object model

`Workspace` is still not a new table:

```
Workspace = teams (1)
            ├─ team_members         membership; exactly one role='leader'
            ├─ team_personas (1)    the workspace persona
            └─ boards (1) → board_columns (1) → sessions (1)
                            ├─ initial_question       the workspace goal
                            ├─ scope_embedding        parked for Full's drift check
                            ├─ artifacts slot='main'  the shared document
                            └─ artifacts slot='note'  the leader's imported annotated copy (§6)
```

`artifacts.slot` earns its keep twice now: `main` is the document everyone reads, `note` is the
already-highlighted copy the leader imports. `artifacts_one_per_slot` enforces one of each, which is
exactly the rule you want.

**Who is leader.** The workspace creator picks the leader at creation — themselves or someone else, as a
required field, not a default. Stored as `team_members.role='leader'`; `team_members_one_leader` already
guarantees at most one. Build transfer-of-leadership in week one; the alternative is a support request
every time someone changes role or leaves.

---

## 4. Two sheets: private and group

The most consequential change in rev 2, and the spec as written has a gap I want to name first.

**The gap.** `individual = private` and `group = leader-only write` together mean a member's thinking can
never reach the Group Result. The leader cannot read private notes; members cannot write group ones. The
Group Result would be the leader reading the document alone.

**The resolution — private by default, promotion is an explicit act (D7).**

| Layer | Who sees it | Who writes it | How things arrive |
|---|---|---|---|
| **Individual** `layer='individual'` | the author only | the author | direct capture |
| — once promoted | the whole workspace | still the author | author presses *Share to group* → `shared_at` is set |
| **Group** `layer='group'` | the whole workspace | **leader only** | leader marks the group sheet, imports an annotated PDF (§6), or pulls a promoted note across |

Members think privately, choose what to put forward, and the leader curates what was put forward. Your
leader-only rule stays literally true for the group layer, private stays genuinely private, and the Group
Result still gets real team input. One nullable column (`shared_at`) carries the whole mechanism.

**The RLS consequence you must not miss.** The existing `"artifact highlights"` policy is
`for all using (can_access_session(...))` — workspace-wide. Private highlights are impossible until that
policy is **dropped and recreated**. The same applies to `"highlight conclusions"` on `mini_conclusions`,
which joins through to the artifact and would cheerfully expose the mini-conclusion of a private highlight
while the highlight itself stays hidden. That is a hole that never shows up in manual testing. Both
rewrites are in §9, and there is a test for them in task 000.

---

## 5. Note input: keyboard and stylus

### 5.1 Two modes, one note

`highlight_notes.input_mode ∈ {keyboard, ink}`. A stylus note keeps **both**: `ink jsonb` holds the stroke
sequence, `content` holds the transcript. The ink is never destroyed — it is the record; the transcript is
a derived, editable field. Recognition will be wrong sometimes, and the user must always be able to see
what they actually wrote.

**Keyboard mode:** a plain `textarea` with markdown preview, not a rich-text editor. Notes are capped at
2,000 characters; a ProseMirror/Tiptap dependency for a 2,000-character field is a bad trade, and markdown
is what has to survive the `.md` export anyway.

**Ink mode:** shadcn `Dialog` on desktop, `Sheet side="bottom"` at ~60vh on tablet — a wide, short writing
surface with two faint ruled baselines, because recognition accuracy depends heavily on consistent letter
scale. Capture via Pointer Events at full pointer resolution: `{x, y, t, pressure}` per point, grouped
into strokes by pointerdown→pointerup. Palm rejection comes free from filtering `pointerType === 'pen'`
once a pen has been seen in the session.

### 5.2 Transcription — the honest version

There is no good free offline handwriting recognizer on the web in 2026. Get the distinction right first:
<cite index="39-1">on-line recognition analyses the individual strokes as they are drawn and reaches higher accuracy than off-line OCR, because it has the temporal sequence and the pressure of each stroke</cite>. You already capture strokes — so **never rasterize ink and hand it to Tesseract**. Full §2 already
flags Tesseract as weak on handwriting, and rasterizing throws away the very signal that would have saved
you.

A three-tier ladder, tried in order:

| Tier | Path | Cost | Availability |
|---|---|---|---|
| 0 | `navigator.createHandwritingRecognizer()` | free, local, instant, works offline | <cite index="39-1">available from Chromium 99 and feature-detected by the presence of `createHandwritingRecognizer` on `navigator`</cite> — narrow in practice. Feature-detect, treat as a bonus, never as the plan |
| 1 | rasterize the ink crop and send it to the vision-capable free-tier model you are already calling | one extra model call | **the default.** Modern vision models read handwriting well and you have the call budget |
| 2 | MyScript `iinkJS` | best accuracy; <cite index="42-1">needs a MyScript developer account, which comes with a free monthly quota against MyScript Cloud</cite> | only if tier 1 is not accurate enough — it is a second third-party data egress, same question as §8 |

**Offline, only tier 0 exists.** Design for it: offline ink notes save as ink, display as ink, and queue a
`transcribe` job in the outbox that runs on reconnect. Say so in the UI rather than letting the user
wonder why no words appeared.

### 5.3 The three sheets, updated

| Sheet | Contents | Write |
|---|---|---|
| `individual_notes` | my highlights and notes on the current page; each carries a *Share to group* control | me |
| `group_notes` | group-layer highlights, promoted member notes, the leader's minutes (`memory_entries scope='group'`) | leader for minutes and group marks; promoted notes appear read-only |
| `result` | tabs Individual / Group — prose, Mermaid, temperature chips | generated |

Same shadcn `Sheet`, one open at a time below 1280px, docked as a right rail above it. **Offline uses the
same layout**, with the group sheet shown as last-synced and read-only, clearly marked as such.

---

## 6. Leader import: a PDF that is already highlighted

The leader drops in a marked-up PDF; every mark becomes a group highlight with an empty note attached and
a stable slug. Detection is a **ladder — OCR is the last rung, not the first**:

| Rung | Case | Method | Text accuracy |
|---|---|---|---|
| 1 | Real PDF annotations (Acrobat, Preview, Notability, GoodNotes) | `page.getAnnotations()` → keep `subtype === 'Highlight'` → read `QuadPoints` | exact — and with a text layer present, intersect the quads with text items to get the underlying string with no OCR at all |
| 2 | Highlight flattened into the page, text layer present | rasterize → colour-mask → boxes → intersect with text-layer items | exact |
| 3 | Scan of paper marked with a physical highlighter | colour-mask → crop each box → Tesseract on the crop only | `extraction='ocr'`, gated on confidence |

Rung 1 is the common case in practice and costs almost nothing. Build it first.

**Coordinates.** <cite index="56-1">PDF rectangles live in user space with the origin at the bottom-left and the Y axis pointing up, so each one must go through `viewport.convertToViewportRectangle()` to reach canvas coordinates — which also accounts for the current scale and any page rotation</cite>. Store the normalized page-relative
rect, never viewport pixels. <cite index="58-1">A QuadPoints array carries four points per rectangle and its length is always a multiple of eight, so a multi-line highlight is several quadrilaterals inside one annotation</cite> — flatten those into one highlight with several rects, not several highlights.

**The colour mask (rungs 2 and 3).** Convert the rendered page to HSV; keep pixels with S > 0.35, V > 0.55
and hue inside the highlighter bands (yellow 40–70°, green 70–160°, cyan 160–200°, pink 290–340°); dilate
3px then erode 2px to close gaps; take connected components; drop anything under 8px tall or 20px wide;
merge components with more than 60% vertical overlap into line boxes. Pure canvas work in a Worker — no
ML, no server.

**Always show a review screen before committing.** A colour mask fires on charts, logos and coloured table
headers. The leader sees detected regions with checkboxes, fixes any OCR text below the confidence gate,
then commits. Silently importing 40 false highlights is worse than importing none.

---

## 7. Connectivity — the answer to the three challenges

### 7.1 Challenge 2 first: API call, or active connection?

**Both, split by what the data is. Writes go over ordinary HTTPS requests. Changes come back over one
WebSocket. Never the reverse.**

| Traffic | Transport | Why |
|---|---|---|
| Durable write (highlight created, note saved, promotion) | HTTPS → PostgREST via `supabase-js`, RLS-checked, transactional | it must survive a dropped socket and must pass the one authorization path you have |
| Durable change, fanned out (a teammate's highlight appeared) | Realtime **Broadcast from Database** on the shared socket | the database is the source of truth; a trigger emits the event after the row commits |
| Ephemeral, high frequency (cursor, "leader is drawing", page position) | Realtime **Broadcast** | never touches Postgres; throttled to ~20 Hz and only sent on real movement |
| Who is here | Realtime **Presence** | auto-cleaned on disconnect, so no stale "online" ghosts |

One socket per client, multiplexed into one channel per workspace (`ws:{sessionId}`). The TLS handshake
happens **once**, at socket open; after that it is frames on an already-negotiated connection, and the
REST writes ride a reused HTTP/2 connection to the same origin. "Active connection" costs you one socket,
not one per feature.

**Never write over the socket.** Broadcast is unvalidated by design. If clients published state directly
you would have a second write path that RLS does not cover. One write path, one set of policies.

### 7.2 Why Broadcast-from-Database and not Postgres Changes

Both work at your size. One of them stops working later and the other does not.

<cite index="35-1">Postgres Changes authorizes every event against every subscriber — a single change to a table with 100 subscribed users triggers 100 authorization checks, so throughput scales with the number of subscribers rather than the write rate; changes are also processed on a single thread to preserve ordering, which means a larger compute add-on does not meaningfully raise throughput</cite>. <cite index="30-1">Supabase's own guidance is that Postgres Changes needs minimal setup but has limitations as an application scales, and recommends Broadcast for most use cases — a trigger plus `realtime.broadcast_changes()` on a private channel, with broadcast authorization policies in place</cite>.

<cite index="36-1">Broadcast from Database reads messages from the write-ahead log into `realtime.messages`, deletes them automatically after three days, routes by topic, and tests messages against row-level security before sending</cite>. Setup is one trigger function and one policy. Pay it once now instead of
migrating a live product later.

```sql
-- one policy on realtime.messages authorizes listening to a workspace topic
create policy "members listen to their workspace"
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1 from sessions s
    join board_columns c on c.id = s.column_id
    join boards b        on b.id = c.board_id
    where realtime.topic() = 'ws:' || s.id::text
      and is_team_member(b.team_id)));
```

<cite index="27-1">That check runs on the first message and is then cached, and policies with joins, function calls or missing indexes measurably increase first-message publishing latency</cite> — so keep the
join indexed, which `sessions(column_id)` and `board_columns(board_id)` already are.

### 7.3 Challenge 1: what collaboration actually has to merge — nothing

Look at what rev 2 made true:

- **Group layer: one writer.** Only the leader marks it.
- **Individual layer: one writer.** Only the author, by definition.
- **Highlight geometry: immutable.** A highlight is created or deleted, never edited in place.

So **no two people ever edit the same text at the same time.** There is no merge problem — no Yjs, no
Automerge, no CRDT, no operational transform. That is a large deletion and it fell out of your own feature
list. Worth noticing before someone reaches for a collaboration SDK out of habit.

The one case left is the same person on two devices (leader on tablet and desktop). Optimistic
concurrency handles it: `highlight_notes.version int`, bumped on every update; an update carrying a stale
version is rejected and returns the current row so the client can show "this changed elsewhere". Ten
lines, not a library.

Latency budget: the mark appears locally on pointerup (optimistic), the row commits in ~80–200 ms,
teammates see it in roughly 100–300 ms.

### 7.4 Challenge 3: offline, and the sequencing decision that has to be made early

**Offline is a capture mode, not a thinking mode.** Available: open the document, highlight, write notes
(typed or ink), read your own past notes and the last-synced group layer. Not available: presence, live
updates, group writes, mini-conclusions, results, transcription above tier 0 — each needs either the model
or other people. Say this plainly in the UI; someone who highlights for an hour offline and finds no
conclusions waiting will think the product broke.

**Build the local-first data layer at task 002, not task 010.** This is the single most important
sequencing call in rev 2. If every read and write goes through a local repository from the very first
highlight, then "offline mode" is just *stop syncing and hide the group layer* — a switch. If offline
arrives at the end, you rewrite the data layer, the optimistic updates and the error handling
simultaneously. Offline retrofits are where projects of this shape die.

| Concern | Choice |
|---|---|
| Service worker | **Serwist** (`@serwist/next`). <cite index="50-1">next-pwa was archived in August 2023, and Serwist is the actively maintained successor built for the App Router</cite>; <cite index="51-1">`@ducanh2912/next-pwa` is a webpack plugin while Next 16 defaults to Turbopack</cite>. Note that <cite index="46-1">Serwist is disabled in development under Turbopack, so the service worker is only active in production builds</cite> |
| Row storage | IndexedDB via `idb` or Dexie — `highlights`, `highlight_notes`, `outbox`, `meta` |
| PDF blob | **OPFS**, not IndexedDB — a 40 MB PDF wants streaming file reads, not a blob row |
| Row ids | **client-generated UUIDv7**, so an offline row carries its final id and sorts by creation time. The schema's `gen_random_uuid()` is only a default; supplying the id changes nothing server-side |
| Sync | an **outbox** `{id, op, table, payload, created_at, attempts}` replayed in order on reconnect, `upsert … on conflict do nothing`. Idempotent because the ids came from the client |
| Conflicts | none, per §7.3 |
| Auth | **offline access must not require a token refresh.** Gate the private sheet on a locally cached session, not a live token check, or the app locks the user out of their own notes on a plane |
| Route | the workspace page is a client component with no server data dependency — no SSR on this route, as required |

**Mode switching (item 6.1).** The switch is authoritative in one direction only. *Work offline* is a
deliberate choice; `navigator.onLine` plus a heartbeat may **degrade** you into offline automatically, but
never silently pulls you back out — reconnecting shows "Back online · 12 changes to sync" with a button.
Silent resync while someone is mid-thought is how you lose their trust.

**Dark mode (item 6.2).** `next-themes` with shadcn's `class` strategy. One real gotcha: **Konva does not
inherit CSS variables** — theme colours must be passed into the stage explicitly and the layer redrawn on
change. And do not darken the highlight colours in dark mode: darken the page, keep the hue, drop the
alpha, or the marks stop reading as highlighter.

**Security note nobody asks for until it is too late:** cached PDFs and notes sit unencrypted on the
device. Offer *clear local data on sign out*, and do not cache the group document offline by default.
Perhutani documents on a personal tablet is a policy question, not a technical one.

### 7.5 Export bundle (item 2, and the traceability requirement)

Export produces **one zip**, not two loose files:

```
workspace-{slug}-{yyyymmdd}.zip
├── document.pdf        original + /Highlight annotations appended
├── notes.md            human-readable, one section per focus point
├── thinkboard.json     lossless: rects, strokes, personas, goal, schema version
└── ink/{slug}.svg      handwritten notes, as drawn
```

Three files, **one id**. The slug lives in the database row, in the markdown anchor, and in the PDF
annotation's `/NM` name — so any one of the three can rebuild the link if the others are edited.

**Slug format:** `h-p{page:02}-{order:02}-{6}`, where the last part is base32 of a hash over the
normalized text plus the quantized rect — `h-p03-07-k4m2xq`. Deterministic, so the same highlight imported
from two copies of the document dedupes instead of duplicating.

**`notes.md` — the round-trip contract:**

```md
---
workspace: bahan-rapat-q3
goal: "Apakah skema biaya 2023 masih layak untuk Q4?"
exported_at: 2026-09-15T10:22:00+07:00
schema: thinkboard-notes/1
---

## p.3 · Cost basis is stated in 2023 prices
<!-- tb id=h-p03-07-k4m2xq page=3 rect=0.118,0.412,0.784,0.437 layer=individual color=amber extraction=text_layer -->

> Cost basis is stated in 2023 prices and not adjusted for the revised tariff.

Kalau pakai angka 2023, selisihnya bisa 12%. Perlu cek ke lampiran B.
```

**The rule, stated once so it is testable:** on import, the `<!-- tb … -->` comment is the *only* thing
read for identity. Prose between comments is free to edit and re-imports cleanly. A section with no
comment imports as a **new, unanchored note** rather than being dropped. A deleted comment orphans its
note and the importer reports it rather than guessing. An HTML comment is used because it is valid
markdown, invisible in every renderer, and trivial to parse.

**Writing the PDF back.** <cite index="58-1">`annotpdf` creates highlight annotations client-side from a page index, a rect, contents, author, colour and opacity, deriving the quadpoints from the rect when they are not supplied</cite> — set `/NM` to the slug and `/Contents` to the note text. Check its maintenance
status before committing; the fallback is building the annotation dictionary by hand with `pdf-lib` and
pushing it onto the page's `/Annots`. Either way, **keep the original PDF bytes and append annotations** —
never re-render the page, or you destroy the text layer everything else depends on.

---

## 8. Own key or free tier (item 3)

**The default comes from the registered email, and the user can override it.** The Full schema already
carries the distinction: `profile_identities.kind ∈ {internal, individual}`.

| Registered as | Default route | Override |
|---|---|---|
| `internal` (institutional address) | institutional shared pool | may supply a personal key |
| `individual` | free-tier shared pool | may supply a personal key |

`llm_requests.key_source ∈ {user, shared}` already records which route a call actually took, so the cost
view and the "you are on the free tier" banner read from the same place.

**Where the key is resolved.** Full's rule is that exactly one component ever resolves a Vault secret, and
that component is the Go gateway. Lite has no gateway, so the component changes identity but the rule
survives: **`apps/web/src/server/llm/vault.ts`, and nothing else.** The route handler takes a `profileId`,
never a key; no route returns a key; resolved secrets sit in a short-TTL in-memory cache and are zeroed on
revoke. Validate on save with one cheap test call, then write `user_llm_keys.last_validated_at` /
`status`.

Take the trade honestly: the Next.js server process now holds a decryption secret. That is the same trust
boundary the gateway would have had — the same exposure in a different process, not a new one. What would
be new is resolving keys in the browser, which is why the browser never sees one.

**Free-tier reality, and it now matters more:** most no-card free tiers fund themselves with your prompts
— <cite index="11-1">Google uses free-tier prompts to improve its models outside the EU, UK and EEA, and Mistral's Experiment tier requires opting into training in exchange for its quota</cite>. For a state-owned
enterprise's internal documents that may be disqualifying by itself. The adapter turns it into a budget
decision rather than an architecture decision — but **answer it before picking a provider**, because tier-1
handwriting transcription (§5.2) sends ink images down the same pipe.

---

## 9. Schema delta — `0004_lite.sql`

Bigger than rev 1, and **one part is not additive**. Flagged inline.

```sql
-- ── enums ──────────────────────────────────────────────────────────────
create type note_visibility  as enum ('individual','group');
create type note_input_mode  as enum ('keyboard','ink');
create type highlight_layer  as enum ('individual','group');

-- ── highlights: layer, promotion, stable slug ──────────────────────────
alter table highlights add column layer     highlight_layer not null default 'individual';
alter table highlights add column shared_at timestamptz;              -- null = private
alter table highlights add column slug      text;
create unique index highlights_slug_idx   on highlights (artifact_id, slug) where slug is not null;
create index        highlights_layer_idx  on highlights (artifact_id, layer);
create index        highlights_shared_idx on highlights (artifact_id) where shared_at is not null;

-- ── notes ──────────────────────────────────────────────────────────────
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

-- ── pipeline: whose result is this ─────────────────────────────────────
alter table points        add column highlight_id     uuid references highlights(id) on delete set null;
alter table pipeline_runs add column owner_profile_id uuid references profiles(id)   on delete set null;
create index points_highlight_idx    on points (highlight_id);
create index pipeline_runs_owner_idx on pipeline_runs (session_id, owner_profile_id);

-- ── helper: is the caller the leader of this session's team ────────────
create or replace function can_lead_session(target_session uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sessions s
    join board_columns c on c.id = s.column_id
    join boards b        on b.id = c.board_id
    where s.id = target_session and is_team_leader(b.team_id));
$$;

-- ⚠️ NON-ADDITIVE: the existing policies are workspace-wide and make private
--    highlights impossible. Both must be replaced.
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

-- ── notes RLS ──────────────────────────────────────────────────────────
alter table highlight_notes enable row level security;
create policy "read notes" on highlight_notes for select using (
  profile_id = current_profile_id()
  or (visibility = 'group' and exists (
        select 1 from highlights h join artifacts a on a.id = h.artifact_id
        where h.id = highlight_id and can_access_session(a.session_id))));
create policy "write own notes" on highlight_notes for all
  using (profile_id = current_profile_id()) with check (profile_id = current_profile_id());

-- ── the client-JWT path records its own LLM usage ──────────────────────
create policy "own llm usage insert" on llm_requests for insert
  with check (profile_id = current_profile_id());

-- ── Lite convention: one active persona per person ─────────────────────
create unique index user_personas_one_active_per_owner
  on user_personas (owner_profile_id) where is_active and owner_profile_id is not null;

-- ── realtime: broadcast durable changes from the database ──────────────
create or replace function tb_broadcast_highlight() returns trigger
language plpgsql security definer set search_path = public as $$
declare topic text;
begin
  select 'ws:' || a.session_id::text into topic
  from artifacts a where a.id = coalesce(new.artifact_id, old.artifact_id);
  perform realtime.broadcast_changes(
    topic, tg_op, tg_op, tg_table_name, tg_table_schema, new, old);
  return null;
end $$;

create trigger highlights_broadcast
  after insert or update or delete on highlights
  for each row execute function tb_broadcast_highlight();
```

Still deliberately **not** changed: `highlights.bbox` absorbs all geometry (no x/y/w/h columns, no colour
column); `highlights.extraction` already splits text-layer from OCR; `mini_conclusions` is already the
per-highlight mini result; `artifacts_one_per_slot`, `team_members_one_leader` and
`team_personas_one_active` already enforce three of your rules; the `pipeline_stage` enum is untouched.

> Worth a separate note in `CLAUDE.md` before it becomes confusing: <cite index="34-1">Supabase is deprecating the `anon` and `service_role` keys by the end of 2026 in favour of publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys</cite>. `0003_grant_schema.sql` and the repo docs still use the old names.

---

## 10. Library set

| Need | Pick | Note |
|---|---|---|
| PDF render + text layer | `pdfjs-dist` | the substrate for everything else |
| Text-highlight plumbing | `react-pdf-highlighter-extended` | viewport-independent highlight format; read its coordinate normalisation even if you write your own |
| Ink / region / stylus | `konva` + `react-konva` | one overlay layer per page, never the whole viewport |
| Stroke capture reference | `atrament` | a good model for `{x, y, time, pressure}` per segment if you roll your own pad |
| OCR | `tesseract.js` | one worker, lazy-loaded, crops only |
| PDF annotation write-back | `annotpdf`, fallback hand-built dict with `pdf-lib` | check maintenance before committing |
| Zip | `fflate` | small and fast; JSZip is the heavier alternative |
| Local storage | `idb` or `dexie`, plus OPFS for blobs | rows in IndexedDB, PDF in OPFS |
| Service worker | `@serwist/next` | disabled in dev under Turbopack |
| Realtime | `@supabase/supabase-js` | one channel per workspace |
| Motion | `motion` | do not animate the Konva layer with it — Konva runs its own tween loop |
| Theme | `next-themes` | pass colours into Konva explicitly |
| Diagrams | `mermaid` | generated output only |
| UI | `tailwindcss` + `shadcn/ui` | |

---

## 11. Build order

One folder per task under `agent-history/NNN-task-<slug>/`, one contract under
`agent-thinking/todo/NNN-todo-<slug>/`. `architecture` keeps the existing `supabase | backend | frontend`
enum; in Lite **`backend` means `apps/web/src/server/**`**.

| # | Task | Arch | Proves | Depends |
|---|---|---|---|---|
| 000 | Apply `0001`–`0003`; author and apply `0004_lite.sql` | `supabase` | the §9 delta migrates clean, **including the two dropped policies** | — |
| 001 | Workspace shell: auth, create workspace, **creator picks leader**, members, personas, goal | `frontend` (sec. `supabase`) | RLS covers the client path | 000 |
| 002 | **Local-first data layer** + PDF render + text-layer highlight capture | `frontend` | coordinates survive zoom and rotate; every write goes through the repository from day one | 001 |
| 003 | Konva ink/region layer + cropped-OCR fallback + confidence gate | `frontend` | §6 rungs 2–3 | 002 |
| 004 | Notes: keyboard mode, three sheets, private + promote | `frontend` | §4, §5.3 | 002 |
| 005 | Realtime: presence, cursors, broadcast-from-database trigger | `frontend` (sec. `supabase`) | §7.1–7.2 with two real browsers | 002 |
| 006 | LLM adapter, key routing (own/free), usage accounting, mini-conclusion | `backend` | §8; start against a **stubbed** provider | 001 |
| 007 | Result engine: individual + group runs, rule-based temperature, renderings | `backend` | §2 | 004, 006 |
| 008 | Handwriting pad + transcription ladder | `frontend` (sec. `backend`) | §5.2 tiers 0–1 | 004 |
| 009 | Leader import of an annotated PDF + review screen | `frontend` | §6, rung 1 first | 003 |
| 010 | Offline mode: Serwist, OPFS, outbox sync, mode switch | `frontend` | §7.4 — thin, because 002 paid for it | 002, 004 |
| 011 | Export bundle: PDF write-back, `notes.md`, `thinkboard.json`, re-import | `frontend` | §7.5 round-trip | 010 |
| 012 | Descriptive markdown + Mermaid visualize | `frontend` | §2 | 007 |
| 013 | Responsive matrix, motion pass, dark mode | `frontend` | §10, Konva theme handoff | 004, 012 |
| 014 | Pilot hardening: rate-limit backoff, queued runs, empty and error states | `backend` (sec. `frontend`) | §8 under real quota | 007 |

**Vertical slice before fan-out**, per Full §6: 000 → 001 → 002 → 006 (stubbed) → 007 gives a demoable
highlight-to-result path. 005 lands early because collaboration is the spine and a transport choice
discovered late is expensive. 010 lands late *only because 002 already did the hard part*.

⚠️ This replaces the starting `task_sequence` in `07-agent-working.md` §8. Full's 001–012 renumber to ≥015 when
Lite closes. Confirm before task 000 opens.

---

## 12. Risks and open decisions

**Risks, reordered for rev 2**

1. **Handwriting accuracy.** No good free offline path exists. The mitigation is architectural, not
   technical: ink is the record, the transcript is derived and editable, and the UI never pretends
   otherwise.
2. **Highlight coordinates across zoom, rotation and re-render.** Still the hardest engineering problem
   here. Normalise at capture, never store viewport pixels, spike it properly in task 002.
3. **The RLS rewrite in §9.** Two policies dropped and replaced. Write an integration test that signs in
   as a second member and asserts a private highlight *and its mini-conclusion* are both invisible. Do it
   in task 000, not later.
4. **Free-tier quota against a six-person workspace.** Caching, debounce and batched result calls are
   load-bearing. Ink transcription increases call volume — budget for it.
5. **Free-tier training terms vs. Perhutani document sensitivity.** Answer first; it can invalidate the
   provider choice, and it now covers ink images too.
6. **Offline data at rest** on personal tablets, unencrypted. A policy question, not a technical one.
7. **Colour-mask false positives** on charts and coloured tables. The review screen is the mitigation.
8. **Serwist disabled in dev** under Turbopack — service-worker bugs surface only in production builds.
   Budget a staging environment, or users will find them.

**Open decisions**

| # | Decision | Default taken |
|---|---|---|
| D1 | Is "individual" a privacy boundary? | **yes** — changed from rev 1 |
| D2 | One PDF per workspace, or several? | one `main`, plus the leader's imported `note` copy |
| D3 | Who runs the Group Result? | leader only |
| D4 | One active persona per person? | yes |
| D5 | Does the Lite backlog replace `07-agent-working.md` §8? | yes, proposed |
| D6 | Can the leader edit generated minutes in place? | yes, as a draft |
| **D7** | **How does a member's thinking reach the Group Result if individual is private?** | **explicit promotion via `shared_at` — this is the contradiction in the feature list; see §4** |
| D8 | Can the leader delete or hide a promoted note? | hide from the group sheet, never delete someone else's note |
| D9 | Does leadership transfer? | yes, by the leader or the workspace creator |
| D10 | Is the group document cached offline? | no, not by default |

These belong in task 000's and 001's `analyze.json.open_questions`, per the convention in
`01-thinkboard-schema-rationale.md`.

---

## 13. Path back to ThinkBoard Full

| Move | Trigger | Work |
|---|---|---|
| Add `services/gateway/` | streaming timeouts, or >~50 concurrent users | port `src/server/pipeline` + `llm` to Go; **build `internal/auth` first** — service-role enters the picture with the gateway's first query |
| Add stages 2–5 | a Result reads confident but unsupported | new files in `stages/` + registry entries; the enum already holds the values |
| Turn on the context warning | sessions drift off the document | `scope_embedding` is already populated |
| Turn on kanban | workspaces need more than one document | `boards` / `board_columns` rows already exist; add `dnd-kit` |
| Move Vault resolution into Go | the gateway exists | delete `src/server/llm/vault.ts`; the rule "one component resolves secrets" never changed, only the component |

The test for any Lite decision is unchanged: *does it create a row, a package or a route that Full would
have had to delete?* If yes, it is wrong. Everything above still passes.

---

## 14. Sources

- Supabase Realtime — Postgres Changes scaling, Broadcast recommendation, Broadcast from Database,
  Realtime Authorization caching, key deprecation: `supabase.com/docs/guides/realtime/*`,
  `supabase.com/features/realtime-broadcast-from-database`
- Handwriting Recognition API — on-line vs off-line recognition, Chromium availability, feature detection:
  `developer.chrome.com/docs/web-platform/handwriting-recognition`; WICG explainer
- MyScript `iinkJS` — `myscript.github.io/iinkJS/docs/`
- Serwist / next-pwa migration status and the Turbopack constraint — `@serwist/next`, next-pwa repo notes
- PDF highlight annotations — QuadPoints structure and `viewport.convertToViewportRectangle()`:
  `annotpdf` (highkite/pdfAnnotate); Nutrient PDF.js highlight guide
- `react-pdf-highlighter-extended`, `konva`, `atrament`, `tesseract.js`
- Free-tier LLM training terms — OpenRouter free-LLM comparison; costbench free-tier survey
- ThinkBoard Full, in repo: `00-thinkboard-abstract-plan.md`, `01-thinkboard-schema-rationale.md`,
  `07-agent-working.md`, `03-backend-folder-architecture.md`, `08-agent-todo-intake.md`, `09-agent-limitation.md`,
  `thinkboard-schema-final.sql`
