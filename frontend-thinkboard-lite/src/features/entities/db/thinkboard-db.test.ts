import "fake-indexeddb/auto"
import Dexie from "dexie"
import { afterEach, describe, expect, it } from "vitest"
import { deleteDb, getDb, openDb } from "./index"
import { STORES_V1 } from "./migrations"

afterEach(async () => {
  await deleteDb("p1")
  await deleteDb("p2")
})

describe("the Dexie schema (02 §6.1)", () => {
  it("is the documented schema, byte for byte", () => {
    expect(STORES_V1).toEqual({
      meta: "key",
      artifacts: "id, sessionId",
      highlights: "id, [artifactId+page], layer, _sync",
      notes: "id, highlightId, profileId, _sync",
      miniConclusions: "highlightId",
      runs: "id, sessionId, ownerProfileId",
      outbox: "++seq, rowId, table, state",
    })
  })

  it("opens with exactly seven stores, the compound index and the autoincrement outbox", async () => {
    const db = openDb("p1")
    await db.open()
    expect(db.tables.map((t) => t.name).sort()).toEqual(["artifacts", "highlights", "meta", "miniConclusions", "notes", "outbox", "runs"])
    expect(db.highlights.schema.indexes.map((i) => i.name)).toEqual(expect.arrayContaining(["[artifactId+page]", "layer", "_sync"]))
    expect(db.outbox.schema.primKey.auto).toBe(true)
    expect(db.outbox.schema.indexes.map((i) => i.name)).toEqual(expect.arrayContaining(["rowId", "table", "state"]))
    expect(db.miniConclusions.schema.primKey.keyPath).toBe("highlightId")
  })

  it("is namespaced per profile, and sign-out deletes it", async () => {
    const a = openDb("p1")
    await a.open()
    expect(a.name).toBe("thinkboard:p1")
    await a.meta.put({ key: "k", value: 1 })

    await deleteDb("p1")
    expect(await Dexie.exists("thinkboard:p1")).toBe(false)
    expect(() => getDb()).toThrow(/no database is open/)

    const b = openDb("p2") // a second profile on the same browser never sees the first one's rows
    await b.open()
    expect(await b.meta.count()).toBe(0)
  })
})
