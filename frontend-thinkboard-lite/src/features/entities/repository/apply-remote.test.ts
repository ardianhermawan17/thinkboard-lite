import "fake-indexeddb/auto"
import type { UUID } from "@shared/types/domain/common"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { deleteDb, openDb, type ThinkboardDb } from "../db"
import type { HighlightRow, NoteRow } from "../types"
import { applyRemote, applyRun, type RemoteEvent } from "./apply-remote"
import { insertHighlight } from "./highlight-repository"

const ME = "me"
const OTHER = "other"
let db: ThinkboardDb
let profile: string
beforeEach(async () => {
  profile = `t-${crypto.randomUUID()}`
  db = openDb(profile)
  await db.open()
})
afterEach(() => deleteDb(profile))

const wireHighlight = (id: string, by: string, text = "remote") => ({
  id, artifact_id: "art-1", profile_id: by, text, page: 1, layer: "individual", shared_at: null, weight: 1,
  extraction: "text_layer", bbox: null, confidence: null, slug: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
})
const wireNote = (id: string, highlightId: string, by: string) => ({ id, highlight_id: highlightId, profile_id: by, visibility: "group", content: "n", version: 1 })
const ev = (type: RemoteEvent["type"], table: string, record: RemoteEvent["record"], oldRecord: RemoteEvent["oldRecord"] = null): RemoteEvent => ({ type, table, record, oldRecord })

describe("apply-remote (g5)", () => {
  it("writes the row clean and NEVER an outbox entry (no echo back to the server)", async () => {
    await applyRemote(ev("INSERT", "highlights", wireHighlight("h1", OTHER)), ME)
    expect(await db.highlights.get("h1" as UUID<"highlights">)).toMatchObject({ id: "h1", _sync: "clean", text: "remote", profileId: OTHER })
    expect(await db.outbox.count()).toBe(0)
  })

  it("maps highlight_notes to notes and mini_conclusions to miniConclusions", async () => {
    await applyRemote(ev("INSERT", "highlight_notes", wireNote("n1", "h1", OTHER)), ME)
    await applyRemote(ev("INSERT", "mini_conclusions", { id: "m1", highlight_id: "h1", content: "c" }), ME)
    expect(await db.notes.get("n1" as NoteRow["id"])).toMatchObject({ _sync: "clean", highlightId: "h1" })
    expect(await db.miniConclusions.get("h1" as HighlightRow["id"])).toMatchObject({ content: "c" })
    expect(await db.outbox.count()).toBe(0)
  })

  it("skips a row whose _sync is not clean, and overwrites one that is", async () => {
    const mine = await insertHighlight({ artifactId: "art-1" as UUID<"artifacts">, profileId: ME as UUID<"profiles">, text: "my unsent edit" })
    await applyRemote(ev("UPDATE", "highlights", wireHighlight(mine.id, ME, "server copy")), ME)
    expect((await db.highlights.get(mine.id))?.text).toBe("my unsent edit") // pending: the local change wins

    await db.highlights.update(mine.id, { _sync: "clean" })
    await applyRemote(ev("UPDATE", "highlights", wireHighlight(mine.id, ME, "server copy")), ME)
    expect((await db.highlights.get(mine.id))?.text).toBe("server copy")
  })

  it("keys a DELETE on old_record when record is null (F7), and takes the highlight's notes with it", async () => {
    await applyRemote(ev("INSERT", "highlights", wireHighlight("h2", OTHER)), ME)
    await applyRemote(ev("INSERT", "highlight_notes", wireNote("n2", "h2", OTHER)), ME)
    await applyRemote(ev("INSERT", "mini_conclusions", { id: "m2", highlight_id: "h2", content: "c" }), ME)
    await applyRemote(ev("DELETE", "highlights", null, { id: "h2" }), ME)
    expect(await db.highlights.count()).toBe(0)
    expect(await db.notes.count()).toBe(0)
    expect(await db.miniConclusions.count()).toBe(0)
  })

  it("RETRACT drops another's row (and what hangs off it) but keeps my own", async () => {
    await applyRemote(ev("INSERT", "highlights", wireHighlight("theirs", OTHER)), ME)
    await applyRemote(ev("INSERT", "highlight_notes", wireNote("tn", "theirs", OTHER)), ME)
    await applyRemote(ev("INSERT", "highlights", wireHighlight("mine", ME)), ME)

    await applyRemote(ev("RETRACT", "highlights", null, wireHighlight("theirs", OTHER)), ME)
    await applyRemote(ev("RETRACT", "highlights", null, wireHighlight("mine", ME)), ME)

    expect(await db.highlights.get("theirs" as HighlightRow["id"])).toBeUndefined()
    expect(await db.notes.get("tn" as NoteRow["id"])).toBeUndefined()
    expect(await db.highlights.get("mine" as HighlightRow["id"])).toBeDefined()
  })

  it("RETRACT of a note drops it unless it is mine", async () => {
    await applyRemote(ev("INSERT", "highlight_notes", wireNote("a", "h", OTHER)), ME)
    await applyRemote(ev("INSERT", "highlight_notes", wireNote("b", "h", ME)), ME)
    await applyRemote(ev("RETRACT", "highlight_notes", null, wireNote("a", "h", OTHER)), ME)
    await applyRemote(ev("RETRACT", "highlight_notes", null, wireNote("b", "h", ME)), ME)
    expect((await db.notes.toArray()).map((n) => n.id)).toEqual(["b"])
  })

  it("ignores tables the kernel does not mirror here, and caches a finished run without an outbox entry", async () => {
    await applyRemote(ev("INSERT", "pipeline_runs", { id: "r1" }), ME)
    expect(await db.runs.count()).toBe(0)
    await applyRun({ id: "r1", session_id: "s", owner_profile_id: null }, { points: [{ id: "p", run_id: "r1" }], conclusions: [], renderings: [] })
    expect(await db.runs.get("r1" as never)).toMatchObject({ sessionId: "s", points: [{ id: "p", runId: "r1" }] })
    expect(await db.outbox.count()).toBe(0)
  })
})
