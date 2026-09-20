import type { RemoteEvent } from "@feature/entities"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createEventBuffer, toRemoteEvent } from "./handlers"

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe("realtime handlers (g3)", () => {
  it("F5: 40 events in a burst reach the store as ONE batch", async () => {
    const flush = vi.fn()
    const buffer = createEventBuffer(flush, 25)
    for (let i = 0; i < 40; i++) buffer.push({ type: "INSERT", table: "highlights", record: { id: `h${i}` }, oldRecord: null })
    expect(flush).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(30)
    expect(flush).toHaveBeenCalledTimes(1)
    expect(flush.mock.calls[0][0]).toHaveLength(40)
  })

  it("a later burst is a second batch, and dispose drops what has not flushed", async () => {
    const flush = vi.fn()
    const buffer = createEventBuffer(flush, 25)
    buffer.push({ type: "DELETE", table: "highlights", record: null, oldRecord: { id: "a" } })
    await vi.advanceTimersByTimeAsync(30)
    buffer.push({ type: "DELETE", table: "highlights", record: null, oldRecord: { id: "b" } })
    buffer.dispose()
    await vi.advanceTimersByTimeAsync(100)
    expect(flush).toHaveBeenCalledTimes(1)
  })

  it("F7: a DELETE keeps only old_record, and RETRACT is typed by the event name, not the operation", () => {
    const del: RemoteEvent = toRemoteEvent("DELETE", { table: "highlights", old_record: { id: "x" } })
    expect(del).toEqual({ type: "DELETE", table: "highlights", record: null, oldRecord: { id: "x" } })
    expect(toRemoteEvent("RETRACT", { table: "highlight_notes", record: { id: "n" } }).type).toBe("RETRACT")
  })
})
