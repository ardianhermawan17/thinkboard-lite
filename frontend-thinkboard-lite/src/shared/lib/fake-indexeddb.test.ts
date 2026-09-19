import "fake-indexeddb/auto"
import { describe, expect, it } from "vitest"

// The fake-indexeddb environment (ffa §10): repository and sync tests run against this, never a real browser.
const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

describe("fake-indexeddb", () => {
  it("stores and reads back a row", async () => {
    const opening = indexedDB.open("scaffold-smoke", 1)
    opening.onupgradeneeded = () => opening.result.createObjectStore("rows", { keyPath: "id" })
    const db = await done(opening)

    const write = db.transaction("rows", "readwrite")
    await done(write.objectStore("rows").put({ id: "a", label: "hello" }))

    const read = db.transaction("rows", "readonly")
    expect(await done(read.objectStore("rows").get("a"))).toEqual({ id: "a", label: "hello" })
    db.close()
  })
})
