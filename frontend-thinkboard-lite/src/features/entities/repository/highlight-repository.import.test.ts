import "fake-indexeddb/auto"
import type { UUID } from "@shared/types/domain/common"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { deleteDb, openDb, type ThinkboardDb } from "../db"
import { insertHighlights, type NewHighlight } from "./highlight-repository"

const ART = "art-1" as UUID<"artifacts">
const ME = "me" as UUID<"profiles">

let db: ThinkboardDb
let profile: string
beforeEach(async () => {
  profile = `t-${crypto.randomUUID()}`
  db = openDb(profile)
  await db.open()
})
afterEach(() => deleteDb(profile))

function forty(): NewHighlight[] {
  return Array.from({ length: 40 }, (_, i) => ({ artifactId: ART, profileId: ME, text: `region ${i}`, page: 3, layer: "group" as const, extraction: "ocr" as const, confidence: 0.5 }))
}

describe("insertHighlights batch (g5, F5)", () => {
  it("writes 40 group highlights and their outbox ops in ONE Dexie transaction, not 40", async () => {
    const spy = vi.spyOn(db, "transaction")
    const rows = await insertHighlights(forty())
    expect(rows).toHaveLength(40)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(await db.highlights.count()).toBe(40)
    expect(await db.outbox.count()).toBe(40)
    expect((await db.highlights.toArray()).every((row) => row.layer === "group" && row._sync === "pending")).toBe(true)
  })

  it("does nothing for an empty import", async () => {
    await expect(insertHighlights([])).resolves.toEqual([])
    expect(await db.outbox.count()).toBe(0)
  })
})
