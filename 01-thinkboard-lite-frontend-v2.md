---
doc_id: thinkboard-lite-frontend-v2
title: Frontend v2 — Dexie⇄Supabase, and handwriting restructured
version: "2.0"
status: proposed
supersedes: "frontend-architecture.md §6.5 (handwriting)"
extends: ["frontend-architecture.md", "frontend-folder-architecture.md"]
companion: v2-handwriting-and-sync.html
---

# ThinkBoard Lite Frontend — v2

Four things this document settles:

1. **Why Dexie**, stated as the problems it solves rather than as a preference (§1).
2. **How Dexie connects to Supabase** — four channels, concrete code, failure matrix (§2).
3. **Handwriting, restructured.** The short answer: *stop building it.* The tablet already does it,
   offline, for free, and it produces real text rather than an image (§3).
4. **What that restructure deletes** from the architecture in v1 (§4).

> §3 is a genuine change of direction, not a refinement. If you only read one section, read that one.

---

## 1. Why Dexie — the context it actually solves

Dexie is a thin, typed wrapper over IndexedDB. Choosing it is really choosing **IndexedDB as the read
model**, and that choice earns its place against four concrete ThinkBoard situations. If none of these
were true, the reference architecture's `createEntityAdapter` + `redux-persist` would be correct and
Dexie would be over-engineering.

### 1.1 The four situations

| # | The situation | What breaks without IndexedDB |
|---|---|---|
| **S1** | A forester opens the workspace on a tablet in an area with no signal, and had opened it yesterday | `createEntityAdapter` lives in memory. Without persistence the app opens **empty**. With `redux-persist` it opens, until S2. |
| **S2** | A 30-page document accumulates 180 highlights, 240 notes, and ink for 60 of them | localStorage is ~5 MB **per origin, as UTF-16 strings**. Ink strokes alone blow past it. `redux-persist` fails by throwing `QuotaExceededError` on write — silently, in a rehydration path nobody watches. |
| **S3** | The note sheet renders the highlights for page 7 of 30, sixty times a second while the user pans | `selectAll().filter(h => h.page === 7)` is O(n) on every render. `db.highlights.where('[artifactId+page]').equals([a, 7])` is an index seek. At 180 rows the difference is not felt; at 2,000 across a workspace list it is. |
| **S4** | A highlight is created offline; the row and its outbox entry must both exist or neither | Two `dispatch()` calls are two separate state updates with no atomicity. A crash between them leaves a row that will never sync — the worst possible failure, because it looks fine. `db.transaction('rw', …)` gives real atomicity. |

**S4 is the one that decides it.** S1–S3 have workarounds; S4 does not. Offline-first *is* the guarantee
that a write lands durably with its sync intent attached, and Redux has no transaction primitive.

### 1.2 The alternatives, honestly

| Option | Verdict | Why |
|---|---|---|
| `createEntityAdapter` + `redux-persist` | ✗ | The reference project already listed persisting `entities` as deviation #5 and had to wipe it with migration v2. Fails S2 and S4. |
| `localStorage` directly | ✗ | Synchronous (blocks the main thread mid-stroke), ~5 MB, strings only. |
| Cache API / Service Worker cache | ✗ | Response-shaped, not row-shaped. No indexes, no transactions, no partial updates. |
| Raw IndexedDB | ~ | Correct but verbose: ~400 lines of request/callback plumbing before the first query. Dexie is that, typed, in 40. |
| **Dexie** | **✓** | Indexes, transactions, typed tables, `useLiveQuery` for reactive reads, ~30 kB. |
| SQLite-wasm (via PowerSync) | ~ | More powerful; see §2.6 for why not yet. |
| Dexie Cloud | ✗ | Dexie's own backend. Does not sync to Supabase. Out of scope by definition. |

### 1.3 What Dexie is *not* solving

Worth stating so nobody expects it to. Dexie is a **local database**. It is not a sync engine, not a
conflict resolver, not a cache-invalidation strategy. Everything in §2 is code you write. That is
acceptable here for one specific reason established earlier in this project:

> **ThinkBoard Lite has no concurrent editing.** The group layer is leader-write; the individual layer is
> author-write; highlight geometry is immutable. Two people never edit the same text at the same time, so
> there is nothing to merge. Sync collapses from "distributed systems problem" to "send these rows in
> order, then diff a manifest."

That property is what makes ~300 lines of hand-rolled sync the right trade instead of a sync engine.
Lose that property — say, by allowing co-edited notes — and §2.6's escape hatch becomes the plan.

---

## 2. The Dexie ⇄ Supabase connection

Four channels, plus one for blobs. Each has one owner file, one direction, and one failure mode.

```
                            ┌──────────────── Supabase ────────────────┐
  ┌─────────┐   ① bootstrap │  PostgREST (RLS)                          │
  │         │ ◀─────────────┤                                           │
  │         │   ② push      │                                           │
  │  Dexie  │ ──────────────▶  insert / update / upsert                 │
  │         │   ③ pull      │  Realtime — broadcast from database       │
  │ IndexedDB ◀─────────────┤  topics: ws:{sessionId}, user:{profileId} │
  │         │   ④ reconcile │  PostgREST — id + updated_at manifest     │
  │         │ ◀─────────────┤                                           │
  └─────────┘               │                                           │
  ┌─────────┐   ⑤ blob      │  Storage                                  │
  │  OPFS   │ ◀─────────────┤  the PDF, once                            │
  └─────────┘               └───────────────────────────────────────────┘
```

### 2.1 ① Bootstrap — first open of a workspace

Runs once per workspace per device, then never again unless local data is cleared.

```ts
// features/sync/bootstrap/bootstrap-workspace.ts
export async function bootstrapWorkspace(sessionId: string, artifactId: string) {
  const known = await db.meta.get(`bootstrapped:${sessionId}`);
  if (known) return;

  // paginate — a workspace can hold thousands of rows and the response is capped
  for await (const page of paginate("highlights", { artifact_id: artifactId })) {
    await db.highlights.bulkPut(page.map(toRow));
  }
  for await (const page of paginate("highlight_notes", { /* joined via highlight */ })) {
    await db.notes.bulkPut(page.map(toRow));
  }
  await db.meta.put({ key: `bootstrapped:${sessionId}`, value: new Date().toISOString() });
}
```

**Rules.** Always paginate (`range()`, 500 rows a page). Always `bulkPut`, never `put` in a loop —
one transaction instead of n. Never bootstrap on every mount; the `meta` flag is the guard.

### 2.2 ② Push — the outbox drains

The only path from local to server. Everything else is a read.

```ts
// features/sync/outbox/push.ts
export async function drainOutbox(signal: AbortSignal) {
  for (;;) {
    const op = await db.outbox.orderBy("seq").first();      // strict seq order
    if (!op || signal.aborted) return;

    try {
      const res = await sendOp(op);                          // supabase.from(...).upsert(...)
      if (res.error) throw res.error;
      await db.transaction("rw", db.outbox, db[op.table], async () => {
        await db.outbox.delete(op.seq);
        await db[op.table].update(op.rowId, { _dirty: 0 });  // clears the pending dot in the UI
      });
    } catch (e) {
      if (isTransient(e)) { await backoff(op.attempts); await bump(op); return; }  // 5xx / offline
      await db.outbox.update(op.seq, { state: "failed", lastError: String(e) });   // 4xx — park it
      return;
    }
  }
}

function sendOp(op: OutboxOp) {
  switch (op.op) {
    case "insert":
    case "update": return supabase.from(op.table).upsert(op.payload, {
                       onConflict: "id", ignoreDuplicates: false });
    case "delete": return supabase.from(op.table).delete().eq("id", op.rowId);
    case "rpc":    return supabase.rpc(op.fn, op.payload);   // promote_highlight lives here
  }
}
```

Four properties, each load-bearing:

| Property | Mechanism | Prevents |
|---|---|---|
| Ordered | `orderBy("seq")`, one at a time | a note insert landing before its highlight — a foreign-key error you only hit on bad network |
| Idempotent | client-generated UUIDv7 + `upsert onConflict: "id"` | duplicates after a crash mid-drain |
| Coalesced | ≤1 pending `update` per row, replaced on each edit | a typed paragraph becoming 200 operations |
| Honest about failure | transient → backoff; 4xx → park and surface | a permission error retried forever behind a spinner that never resolves |

**RLS is the authorisation.** The outbox carries the user's JWT, so a write a policy forbids fails with a
4xx and parks — it cannot be smuggled through by being offline first. That is the property that makes it
safe to let the client write directly.

### 2.3 ③ Pull — realtime, live

```ts
// features/sync/realtime/channel.ts
export async function openChannels(sessionId: string, profileId: string) {
  await supabase.realtime.setAuth();                     // REQUIRED, and again on every token refresh

  const ws   = supabase.channel(`ws:${sessionId}`,   { config: { private: true } });
  const mine = supabase.channel(`user:${profileId}`, { config: { private: true } });

  for (const ch of [ws, mine]) {
    ch.on("broadcast", { event: "INSERT" }, ({ payload }) => applyRemote("upsert", payload))
      .on("broadcast", { event: "UPDATE" }, ({ payload }) => applyRemote("upsert", payload))
      .on("broadcast", { event: "DELETE" }, ({ payload }) => applyRemote("delete", payload))
      .subscribe();
  }
  return () => { ws.unsubscribe(); mine.unsubscribe(); };
}
```

```ts
// features/entities/repository/apply-remote.ts
export async function applyRemote(kind: "upsert" | "delete", payload: RemotePayload) {
  const table = payload.table as TableName;
  await db.transaction("rw", db[table], async () => {
    const local = await db[table].get(payload.record.id);
    if (local?._dirty) return;                  // ← local edit wins until it has been pushed
    if (kind === "delete") await db[table].delete(payload.old_record.id);
    else                   await db[table].put(toRow(payload.record));
  });
}
```

Three rules:

- **Never write an outbox entry here.** A remote change echoed back is an infinite loop.
- **`_dirty` local rows are not overwritten.** The push in ②, not the pull in ③, is what clears `_dirty`,
  so a row that is mid-flight cannot be clobbered by its own echo arriving first.
- **The topic decides privacy.** Group and promoted rows go to `ws:{sessionId}`; private rows go to
  `user:{profileId}`. A single-topic trigger would broadcast private rows to the whole workspace while the
  table itself stayed correctly locked.

### 2.4 ④ Reconcile — the catch-up

Realtime only delivers while you are connected. Everything that happened while you were offline arrives
here, and this is the channel most people skip and then wonder why deletes never propagate.

```ts
// features/sync/reconcile/manifest-diff.ts
export async function reconcile(artifactId: string) {
  const { data: remote } = await supabase
    .from("highlights").select("id, updated_at").eq("artifact_id", artifactId);   // a few KB

  const local  = await db.highlights.where("artifactId").equals(artifactId).toArray();
  const rMap   = new Map(remote.map(r => [r.id, r.updated_at]));

  const stale   = local.filter(l => rMap.has(l.id) && rMap.get(l.id)! > l.updatedAt).map(l => l.id);
  const missing = remote.filter(r => !local.some(l => l.id === r.id)).map(r => r.id);
  const gone    = local.filter(l => !rMap.has(l.id) && !l._dirty).map(l => l.id);   // ← catches deletes

  if (stale.length || missing.length) await fetchByIds([...stale, ...missing]);
  if (gone.length) await db.highlights.bulkDelete(gone);
}
```

**Why a manifest and not `updated_at > lastSyncedAt`.** A timestamp query cannot see a row that was
deleted — it returns nothing for it, which is indistinguishable from "unchanged". The manifest is a few
KB for a few hundred rows and catches deletes for free. The alternative is tombstone rows, which is a
schema change plus a cleanup job.

This is also why `highlights.updated_at` had to be added in `0004_lite.sql`. Without it there is nothing
to compare.

### 2.5 The reconnect sequence — order is not negotiable

```
push → pull → resubscribe
```

```ts
// features/sync/middleware/sync-listener.ts
startAppListening({
  predicate: (a, curr, prev) => curr.sync.phase === "collaboration" && prev.sync.phase === "offline",
  effect: async (_action, api) => {
    api.dispatch(syncStarted());
    await drainOutbox(api.signal);                 // 1. my changes go first
    await reconcile(currentArtifactId(api));       // 2. then I take theirs
    await openChannels(sessionId, profileId);      // 3. then I stay current
    api.dispatch(syncFinished({ at: new Date().toISOString() }));
  },
});
```

Pull before push and the reconcile overwrites local rows you have not sent yet. Subscribe before
reconcile and events land while the manifest is in flight, so the diff is computed against a moving
target. This order is the whole protocol.

### 2.6 ⑤ The blob channel, and the failure matrix

The PDF is fetched once from Supabase Storage into OPFS, keyed by `storage_path`. It is never re-fetched
unless the hash changes — a 40 MB re-download on every open is the difference between usable and not on a
field connection.

| Failure | Detected by | Behaviour |
|---|---|---|
| Offline | fetch rejects / `navigator.onLine` | queue in outbox, UI shows "12 changes to sync" |
| 401 / token expired | status 401 | refresh once, retry; on second failure park and prompt |
| 403 / RLS denied | status 403 | park as `failed` and surface — never retry |
| 409 / stale `version` on a note | status 409 | keep local text as a **second note**; never discard typing |
| Realtime socket drop | `CHANNEL_ERROR` / `CLOSED` | reconnect with jitter, then run ④ before ③ |
| Bootstrap interrupted | `meta` flag absent | resumes from the start; `bulkPut` makes it idempotent |
| OPFS evicted | file missing | re-fetch from Storage, show a one-line notice |

### 2.7 Why not PowerSync or ElectricSQL

Both are real and both would work. Neither is right for Lite *now*.

**ElectricSQL is out on two counts.** <cite index="38-1">It is a read-path sync engine that hands you the entire write path</cite> — so you would still write everything in §2.2, and gain a dependency. And
<cite index="38-1">Electric announced on 11 August 2026 that it is joining Databricks, with its deployment docs still recommending Electric Cloud beneath a banner announcing the move</cite>. Building a pilot on a service whose vendor has signalled a wind-down is an avoidable risk.

**PowerSync is the credible escape hatch, not the starting point.** <cite index="34-1">It connects to Supabase without schema changes, streams into a local SQLite database, places local writes on an upload queue, and is self-hostable with a free cloud tier</cite>, and of the three pluggable engines <cite index="30-1">it is the one with first-class offline support</cite>. Against that:

- It replaces Dexie with SQLite-wasm and its own query layer — a different read model, not an addition.
- It requires Postgres logical replication. <cite index="31-1">PowerSync's own Supabase guide currently carries a notice about a Supabase logical-replication issue where idle instances accumulate excessive WAL and max out disk</cite>. A pilot project on a small plan is exactly an idle instance.
- Its hardest-won feature is partial replication across many users with causal consistency. ThinkBoard has
  one document per workspace and no concurrent writers. You would be paying for a solution to a problem
  the design already removed.

**Adopt PowerSync when** any of these becomes true: notes become co-editable; a workspace holds many
documents and you need partial sync rules; or the hand-rolled sync accumulates more than ~500 lines and
its own bug backlog. Until then, §2.1–2.5 is smaller, has no extra service, and is fully inspectable.

---

## 3. Handwriting — restructured

> **The v1 plan was wrong about this.** It treated handwriting as a recognition problem to solve in-app,
> with an LLM as the default transcription tier. That makes the feature depend on the network, on a
> provider's free quota, and on sending a user's handwriting to a third party. All three are avoidable.

### 3.1 The reframe

**Handwriting is an input method, not a storage format.** The tablet already converts pen strokes to text,
on-device, offline, in the operating system — and it does it into any ordinary web text field.

<cite index="13-1">On iPad, writing with Apple Pencil in any text field converts handwriting into typed text, and the conversion happens directly on the device, so the writing stays private</cite>. <cite index="11-1">It works in any standard text input box, including text fields on web pages</cite>.

On Android, <cite index="23-1">stylus handwriting is enabled for all text input fields by default on Android 14 and higher, including WebView text widgets, and handwriting mode starts when a stylus motion event is detected within the field's handwriting bounds</cite>. Chromium carries a dedicated subsystem for it: <cite index="25-1">because the platform cannot see HTML input fields inside a tab, Chrome detects a stylus-writable input field, initiates recognition, and the platform commits the recognised text through the field's input connection — with Samsung's DirectWriting exposed to Chrome and WebView the same way</cite>.

So the correct implementation of "handwriting tab" is:

> **A plain `<textarea>` that looks like ruled paper.**

No canvas. No recognizer. No model. No network. No LLM. The user writes with the pen; the OS types into
the field; ThinkBoard receives an ordinary `onChange` with real text. Goal #1 — *writing fulfilled
without saving as image or canvas* — is satisfied completely, because nothing is ever captured as ink at
all in this path.

### 3.2 The three tiers, reordered

| Tier | Path | Offline | LLM | Output | Expected share |
|---|---|---|---|---|---|
| **A — OS stylus-to-text** *(default)* | pen → `<textarea>` → typed text | ✅ | ❌ never | real text | most tablet users with a stylus |
| **B — vector ink + deferred transcription** | pen → stroke capture → text later | ✅ capture, ❌ transcribe | only for transcription | strokes now, text later | no stylus support, unsupported language |
| **C — ink stays ink** | pen → strokes → SVG | ✅ | ❌ | a drawing | sketches, diagrams, signatures |

**Tier B stores vector strokes, not an image.** `[{x, y, t, p}, …]` is about 2 kB for a sentence,
scales to any zoom, re-renders as crisp SVG, and can still be transcribed months later. A PNG can do none
of that. "Not saved as an image" is satisfied in every tier.

### 3.3 The constraints Tier A imposes — read these before designing the sheet

Tier A is free, but only if the note input is a *real text field*. Four things will silently disable it:

1. **No `contenteditable`, no rich-text editor.** Android's own guidance is that custom text editors
   outside the standard components need extra work to support stylus input, and on the web there is no
   equivalent hook. Tiptap, Slate, ProseMirror, Lexical — all break Tier A. **A plain `<textarea>`.**
   (v1 already chose this for prompt-budget reasons; this is a far stronger reason.)
2. **Nothing may overlay the field.** Android's docs call out "a complex layout with text entry fields
   overlaying a drawing surface" as needing customisation — which is precisely ThinkBoard's screen.
   **The note sheet must not sit on top of the Konva canvas.** Give it its own stacking context and a real
   background, or the Stage swallows the pen event and the OS never sees a handwriting gesture.
3. **Handwriting bounds extend past the field.** Android reserves roughly 40 dp above and below and 10 dp
   either side to detect writing intent. Keep ~16 px of clear, non-interactive padding around the
   textarea. No buttons hugging its edge.
4. **The field must exist and be focusable when the pen lands.** Do not lazily mount the textarea on tap.
   Render it, let the pen initiate.

### 3.4 The honest problem: language

<cite index="15-1">Scribble recognises English, Cantonese, Chinese, French, German, Italian, Japanese, Spanish and Portuguese</cite>. **Bahasa Indonesia is not on that list**, and for
Perhutani that is the single biggest risk in this section.

What it means in practice: Indonesian is Latin script, so an English recogniser transcribes the letters
mostly correctly but biases toward English vocabulary — `perhutani` may come back as something else, and
domain terms will fare worst. <cite index="17-1">Accuracy on supported languages is reported around 90–95%</cite>; Bahasa will be below that, and the errors will cluster on exactly the words that matter.

Android is the better platform here: Gboard's handwriting input supports far more languages than Scribble,
so an Android 14 tablet with a stylus is likely to handle Bahasa where an iPad will not.

**Mitigations, in order of preference:**

1. **Test it in week one with three real users on their own tablets, writing real Indonesian.** This is a
   45-minute test that decides the feature. §5 of the companion artifact is a live field you can hand
   someone — open it on the tablet and write.
2. **A per-note language toggle.** `id` routes to Tier B (ink + deferred transcription) with a one-line
   explanation; `en` uses Tier A. Two lines of UI, and it turns an unpredictable failure into a stated
   trade.
3. **If iPad Bahasa accuracy is unusable and iPads dominate the fleet**, Tier B becomes the default and
   the vision-model transcription from v1 returns — but as the *fallback*, reached by maybe 30% of notes
   instead of 100%, which changes the quota arithmetic entirely.

### 3.5 Tier B, when it is reached

The v1 ink pad survives, demoted from primary to fallback:

- Capture `{x, y, t, pressure}` per point via Pointer Events, on a Konva Stage, in a `Dialog` / bottom
  `Sheet` — with the important change that it is **opened deliberately**, from a "draw instead" control,
  rather than being the default note surface.
- Store strokes in `highlight_notes.ink` as JSON. Render as SVG when displaying.
- Queue a `transcribe` op in the outbox. On reconnect: try `navigator.createHandwritingRecognizer()` if it
  exists, else one vision-model call, else leave as ink and stop asking.
- `transcribed_at` distinguishes "not yet" from "tried and failed".
- **The ink is never destroyed.** The transcript is a derived, editable field beside it.

### 3.6 What the user sees

The note sheet has two tabs, exactly as you specified:

```
┌─ Note on "Cost basis is stated in 2023 prices" ────────────┐
│  [ Keyboard ]  [ Handwriting ]              ✎ pen detected │
├────────────────────────────────────────────────────────────┤
│  ╭────────────────────────────────────────────────────────╮│
│  │  ................................................      ││   ← a <textarea>
│  │  ................................................      ││     styled as ruled paper.
│  │  ................................................      ││     The OS does the rest.
│  ╰────────────────────────────────────────────────────────╯│
│  Write with your pen. Text appears as you go.              │
│                                    ✎ draw instead (Tier B) │
└────────────────────────────────────────────────────────────┘
```

Both tabs write to the same `content` field. The only difference between them is the styling of the field
and the hint text — which is the clearest possible sign that this is the right design.

**Discoverability is the real work here, not recognition.** Users do not know Scribble exists in a web
page. Detect a pen (`pointerdown` with `pointerType === 'pen'`), and the first time you see one, show a
one-time coach mark on the Handwriting tab. That single piece of UI is most of the feature's value.

---

## 4. What this changes in the v1 architecture

| v1 | v2 | Effect |
|---|---|---|
| `shared/components/canvas/ink-pad/` is the handwriting surface | it is the **Tier B fallback**, opened deliberately | the primary path has no canvas leaf at all |
| `shared/lib/handwriting.ts` is a 3-tier recogniser ladder | it is a **capability detector** plus the Tier B ladder | `detectHandwritingSupport()` → `{ pen, osStylusText, localRecognizer }` |
| Handwriting needs the network for tier 1 | the default tier needs **nothing** | offline note-taking is complete, not partial |
| Note input might be a rich editor | **must** be a `<textarea>` | now an invariant, not a preference |
| Note sheet overlays the canvas | must have its own stacking context and opaque background | new layout constraint |
| Ink transcription is a per-note LLM call | a fallback reached by a minority of notes | free-tier quota pressure drops sharply |

**New invariants** (extending I11–I25):

- **I26** — The note input is a `<textarea>` or `<input>`. No `contenteditable`, no rich-text editor
  library anywhere in `features/notes/**`.
- **I27** — No element with `pointer-events: auto` overlaps the note textarea's bounding box plus 16 px.
  A Konva `Stage` beneath the sheet must be `pointer-events: none` while the sheet is open.
- **I28** — `features/notes/**` contains no LLM call on the default path. Transcription is queued through
  the outbox, never awaited in a note-save handler.

**Device matrix, updated for 70% tablet:**

| | Mobile < 768 | **Tablet 768–1279 (70% of users)** | Desktop ≥ 1280 |
|---|---|---|---|
| Keyboard notes | ✅ | ✅ | ✅ |
| **Handwriting notes (Tier A)** | ⚠️ stylus phones only | ✅ **primary** | ⚠️ pen displays only |
| Text-layer highlights | ⚠️ tap-and-hold | ✅ | ✅ |
| Freehand ink on the document | ❌ | ✅ | ✅ mouse marquee |

Tablet is not the secondary form factor. It is the product.

---

## 5. Schema addendum

One enum value, one column. Additive.

```sql
-- how the text in a note was produced — for measuring tier A adoption, and for support
alter type note_input_mode add value 'stylus_os';   -- keyboard | ink | stylus_os

-- which recogniser produced the transcript, when one did
alter table highlight_notes add column transcribed_by text;   -- 'os' | 'local' | 'model' | null
```

`stylus_os` notes have `content` and no `ink` — they are text rows like any other. That is the point.
`transcribed_by` is how you find out, three months in, whether Tier A is carrying the load or whether
everyone quietly fell back.

---

## 6. Open questions

| # | Question | Default |
|---|---|---|
| **Q7** | Does Scribble produce usable Bahasa Indonesia on the fleet's actual iPads? | **unknown — test in week one, §3.4** |
| **Q8** | What is the real tablet mix: iPad, Samsung with S Pen, or other Android? | unknown; it decides how much Tier B matters |
| **Q9** | Do users have styluses at all, or fingers? Tier A needs a pen. | assume pen; verify |
| **Q10** | Hand-rolled sync, or PowerSync from day one? | **hand-rolled** (§2.7), with PowerSync as the named escape hatch |
| Q11 | Does the note sheet dock beside the document, or overlay it? | **dock at ≥1280**, overlay below — forced by I27 |

Q7 is the one to answer first. It is cheap, it is fast, and it is the difference between a feature that
costs nothing and a feature that costs a model call per note.
