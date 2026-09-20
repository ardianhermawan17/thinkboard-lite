import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const order: string[] = []
let authListener: (event: string) => void = () => {}
let broadcast: Record<string, (msg: { payload: unknown }) => void> = {}
let subscribeStatus: Record<string, (status: string) => void> = {}

const fake = {
  realtime: { setAuth: vi.fn(async () => void order.push("setAuth")) },
  channel: vi.fn((topic: string, opts: unknown) => {
    order.push(`channel:${topic}:${JSON.stringify(opts)}`)
    const ch = {
      on: vi.fn((_type: string, filter: { event: string }, cb: (m: { payload: unknown }) => void) => ((broadcast[`${topic}|${filter.event}`] = cb), ch)),
      subscribe: vi.fn((cb: (status: string) => void) => (order.push(`subscribe:${topic}`), (subscribeStatus[topic] = cb), ch)),
    }
    return ch
  }),
  removeChannel: vi.fn(),
  auth: { onAuthStateChange: vi.fn((cb: (event: string) => void) => ((authListener = cb), { data: { subscription: { unsubscribe: vi.fn() } } })) },
}
vi.mock("@shared/lib/supabase", () => ({ getSupabase: () => fake }))

import { openChannels } from "./channel"

beforeEach(() => {
  order.length = 0
  broadcast = {}
  subscribeStatus = {}
  fake.realtime.setAuth.mockClear()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe("realtime channel (g3)", () => {
  it("I22: setAuth() runs BEFORE either topic subscribes, and both topics are private", async () => {
    await openChannels("S", "P", { onBatch: async () => {}, onDrop: () => {} })
    const firstSubscribe = order.findIndex((o) => o.startsWith("subscribe:"))
    expect(order.indexOf("setAuth")).toBeGreaterThanOrEqual(0)
    expect(order.indexOf("setAuth")).toBeLessThan(firstSubscribe)
    expect(order.filter((o) => o.startsWith("channel:"))).toEqual(['channel:ws:S:{"config":{"private":true}}', 'channel:user:P:{"config":{"private":true}}'])
  })

  it("I22: every token refresh calls setAuth() again, or delivery stops about an hour in", async () => {
    await openChannels("S", "P", { onBatch: async () => {}, onDrop: () => {} })
    expect(fake.realtime.setAuth).toHaveBeenCalledTimes(1)
    authListener("TOKEN_REFRESHED")
    expect(fake.realtime.setAuth).toHaveBeenCalledTimes(2)
    authListener("SIGNED_IN")
    expect(fake.realtime.setAuth).toHaveBeenCalledTimes(2)
  })

  it("delivers broadcasts from both topics as typed events, batched, including RETRACT", async () => {
    const batches: unknown[][] = []
    await openChannels("S", "P", { onBatch: async (events) => void batches.push(events), onDrop: () => {} })
    broadcast["ws:S|INSERT"]({ payload: { table: "highlights", record: { id: "h1" } } })
    broadcast["user:P|RETRACT"]({ payload: { table: "highlight_notes", record: { id: "n1" } } })
    await vi.advanceTimersByTimeAsync(30)
    expect(batches).toHaveLength(1)
    expect(batches[0]).toMatchObject([{ type: "INSERT", table: "highlights" }, { type: "RETRACT", table: "highlight_notes" }])
  })

  it("a dropped socket asks the engine to reconnect; closing it ourselves does not", async () => {
    const onDrop = vi.fn()
    const handle = await openChannels("S", "P", { onBatch: async () => {}, onDrop })
    subscribeStatus["ws:S"]("CHANNEL_ERROR")
    expect(onDrop).toHaveBeenCalledTimes(1)
    handle.close()
    subscribeStatus["user:P"]("CLOSED")
    expect(onDrop).toHaveBeenCalledTimes(1)
    expect(fake.removeChannel).toHaveBeenCalledTimes(2)
  })
})
