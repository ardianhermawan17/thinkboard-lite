import "fake-indexeddb/auto"
import type { UUID } from "@shared/types/domain/common"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteDb, openDb, type ThinkboardDb } from "../db"
import { deleteHighlight, insertHighlight, promoteHighlight, updateHighlight } from "./highlight-repository"
import { insertNote, updateNote } from "./note-repository"

const ART = "art-1" as UUID<"artifacts">
const ME = "me" as UUID<"profiles">
const OTHER = "other" as UUID<"profiles">

let db: ThinkboardDb
let profile: string
beforeEach(async () => {
  profile = `t-${crypto.randomUUID()}`
  db = openDb(profile)
  await db.open()
})
afterEach(() => deleteDb(profile))

const hl = (page = 1) => insertHighlight({ artifactId: ART, profileId: ME, text: "quoted text", page })

describe("repository writes (g2): the row and its outbox entry are one transaction", () => {
  it("lands the row as pending together with one queued op that carries the WIRE shape", async () => {
    const row = await hl()
    expect(row._sync).toBe("pending")
    expect(await db.highlights.get(row.id)).toMatchObject({ id: row.id, layer: "individual", weight: 1, extraction: "text_layer" })
    const ops = await db.outbox.toArray()
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({ rowId: row.id, table: "highlights", op: "insert", state: "queued", attempts: 0 })
    expect(ops[0].payload).toMatchObject({ id: row.id, artifact_id: ART, profile_id: ME, text: "quoted text" })
    expect(Object.keys(ops[0].payload)).not.toContain("_sync")
    expect(Object.keys(ops[0].payload).some((k) => /[A-Z]/.test(k))).toBe(false)
  })

  it("ATOMICITY: a throw mid-transaction leaves neither the row nor the op", async () => {
    vi.spyOn(db.outbox, "add").mockRejectedValueOnce(new Error("boom"))
    await expect(hl()).rejects.toThrow("boom")
    expect(await db.highlights.count()).toBe(0)
    expect(await db.outbox.count()).toBe(0)
  })

  it("ATOMICITY: the same holds for an update, the previous row survives untouched", async () => {
    const row = await hl()
    vi.spyOn(db.outbox, "update").mockRejectedValueOnce(new Error("boom")) // an update merges into the queued insert (RULE-11)
    await expect(updateHighlight(row.id, { text: "changed" })).rejects.toThrow("boom")
    expect((await db.highlights.get(row.id))?.text).toBe("quoted text")
    expect(await db.outbox.count()).toBe(1)
  })

  it("keeps ops in seq order, bumps a note's version on every write, and folds the edit into its queued insert (RULE-11)", async () => {
    const h = await hl()
    const n = await insertNote({ highlightId: h.id, profileId: ME, content: "a" })
    const n2 = await updateNote(n.id, { content: "b" })
    expect(n2.version).toBe(2)
    expect((await db.notes.get(n.id))?.content).toBe("b")
    const ops = await db.outbox.orderBy("seq").toArray()
    expect(ops.map((o) => `${o.table}:${o.op}`)).toEqual(["highlights:insert", "notes:insert"]) // the update merged into the insert
    expect(ops[1].payload).toMatchObject({ content: "b", version: 2 })
    expect(ops[1].table).toBe("notes") // the Dexie name; the push maps it to highlight_notes
  })

  it("deleting a highlight takes its notes and mini-conclusion with it, in one op", async () => {
    const h = await hl()
    await insertNote({ highlightId: h.id, profileId: ME })
    await db.miniConclusions.put({ highlightId: h.id } as never)
    await db.outbox.clear() // the earlier ops were already pushed; otherwise the delete would cancel the queued insert
    await deleteHighlight(h.id)
    expect(await db.highlights.count()).toBe(0)
    expect(await db.notes.count()).toBe(0)
    expect(await db.miniConclusions.count()).toBe(0)
    const ops = await db.outbox.orderBy("seq").toArray()
    expect(ops.at(-1)).toMatchObject({ table: "highlights", op: "delete", payload: { id: h.id } })
  })

  it("promotion is one rpc op; the author's note goes group, someone else's does not", async () => {
    const h = await hl()
    const mine = await insertNote({ highlightId: h.id, profileId: ME })
    const theirs = await insertNote({ highlightId: h.id, profileId: OTHER })
    const shared = await promoteHighlight(h.id, mine.id)
    expect(shared.sharedAt).not.toBeNull()
    expect((await db.notes.get(mine.id))?.visibility).toBe("group")
    expect((await db.notes.get(theirs.id))?.visibility).toBe("individual")
    expect((await db.outbox.orderBy("seq").toArray()).at(-1)).toMatchObject({
      op: "rpc",
      fn: "promote_highlight",
      payload: { p_highlight: h.id, p_note: mine.id },
    })
  })

  it("a highlight created and deleted before any push sends nothing (RULE-11)", async () => {
    const h = await hl()
    await deleteHighlight(h.id)
    expect(await db.outbox.count()).toBe(0)
  })
})
