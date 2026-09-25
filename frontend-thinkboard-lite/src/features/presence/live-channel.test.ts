import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getSupabase: vi.fn() }))
vi.mock("@shared/lib/supabase", () => ({ getSupabase: () => mocks.getSupabase() }))

import { openLiveChannel, presenceToPeers } from "./live-channel"

type Handler = (arg?: unknown) => void

function fakeChannel(status = "SUBSCRIBED") {
  const handlers: Record<string, Handler[]> = {}
  const channel = {
    on: vi.fn((type: string, _filter: unknown, cb: Handler) => {
      ;(handlers[type] ??= []).push(cb)
      return channel
    }),
    subscribe: vi.fn((cb: (s: string) => void) => {
      cb(status)
      return channel
    }),
    track: vi.fn(async () => ({})),
    send: vi.fn(async () => ({})),
    presenceState: vi.fn(() => ({ key: [{ profileId: "p1", page: 2 }, { profileId: 7 }] })),
  }
  return { channel, handlers }
}

afterEach(() => vi.clearAllMocks())

describe("presenceToPeers (g1)", () => {
  it("flattens presence state and drops malformed entries", () => {
    expect(presenceToPeers({ a: [{ profileId: "p1", page: 2 }], b: [{ profileId: 7, page: 1 }, { profileId: "p2", page: "x" }] })).toEqual([{ profileId: "p1", page: 2 }])
  })
})

describe("openLiveChannel (g1, g6)", () => {
  it("subscribes to live:{sessionId}, tracks presence, and wires peers and cursors", () => {
    const { channel, handlers } = fakeChannel()
    const removeChannel = vi.fn()
    const client = { channel: vi.fn(() => channel), removeChannel }
    mocks.getSupabase.mockReturnValue(client)
    const onPeers = vi.fn()
    const onCursor = vi.fn()
    const onDrop = vi.fn()
    const handle = openLiveChannel("s1", "p1", 2, { onPeers, onCursor, onDrop })

    expect(client.channel).toHaveBeenCalledWith("live:s1", { config: { private: true, presence: { key: "p1" } } })
    expect(channel.track).toHaveBeenCalledWith({ profileId: "p1", page: 2 })

    handlers.presence[0]()
    expect(onPeers).toHaveBeenCalledWith([{ profileId: "p1", page: 2 }])

    handlers.broadcast[0]({ payload: { profileId: "p2", page: 2, x: 0.1, y: 0.2 } })
    expect(onCursor).toHaveBeenCalledWith({ profileId: "p2", page: 2, x: 0.1, y: 0.2 })

    handle.publishCursor({ profileId: "p1", page: 2, x: 0.3, y: 0.4 })
    expect(channel.send).toHaveBeenCalledWith({ type: "broadcast", event: "cursor", payload: { profileId: "p1", page: 2, x: 0.3, y: 0.4 } })

    handle.close()
    expect(removeChannel).toHaveBeenCalledWith(channel)
  })

  it("reports a dropped channel", () => {
    const { channel } = fakeChannel("CHANNEL_ERROR")
    mocks.getSupabase.mockReturnValue({ channel: () => channel, removeChannel: vi.fn() })
    const onDrop = vi.fn()
    openLiveChannel("s1", "p1", 1, { onPeers: vi.fn(), onCursor: vi.fn(), onDrop })
    expect(onDrop).toHaveBeenCalledTimes(1)
  })
})
