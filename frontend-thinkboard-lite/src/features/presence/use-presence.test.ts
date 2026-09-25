import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const handle = { publishCursor: vi.fn(), close: vi.fn() }
  return { handle, hooks: null as null | { onPeers: (peers: unknown) => void; onCursor: (cursor: unknown) => void; onDrop: () => void }, openLiveChannel: vi.fn() }
})
vi.mock("./live-channel", () => ({
  openLiveChannel: (...args: unknown[]) => {
    mocks.hooks = args[3] as never
    return mocks.handle
  },
}))

import type { Cursor, Peer } from "./types"
import { usePresence } from "./use-presence"

afterEach(() => vi.clearAllMocks())

const mount = (overrides: Record<string, unknown> = {}) => renderHook(() => usePresence({ sessionId: "s1", profileId: "p1", page: 2, leaderId: "pL", ...overrides }))

describe("usePresence (g1, g2, g4)", () => {
  it("tracks the peers the channel reports", () => {
    const { result } = mount()
    act(() => mocks.hooks!.onPeers([{ profileId: "p2", page: 2 }] as Peer[]))
    expect(result.current.peers).toEqual([{ profileId: "p2", page: 2 }])
  })

  it("raises the leader indicator for the leader's cursor and clears on the stroke end", () => {
    const { result } = mount()
    act(() => mocks.hooks!.onCursor({ profileId: "pL", page: 2, x: 0, y: 0, drawing: true } as Cursor))
    expect(result.current.leaderDrawing).toBe(true)
    act(() => mocks.hooks!.onCursor({ profileId: "pL", page: 2, x: 0, y: 0, drawing: false } as Cursor))
    expect(result.current.leaderDrawing).toBe(false)
  })

  it("ignores a non-leader cursor and a cursor on another page", () => {
    const { result } = mount()
    act(() => mocks.hooks!.onCursor({ profileId: "pX", page: 2, x: 0, y: 0, drawing: true } as Cursor))
    act(() => mocks.hooks!.onCursor({ profileId: "pL", page: 9, x: 0, y: 0, drawing: true } as Cursor))
    expect(result.current.leaderDrawing).toBe(false)
  })

  it("publishes a cursor once and drops an unchanged repeat (RULE-20)", () => {
    const { result } = mount()
    act(() => {
      result.current.publishCursor(0.1, 0.2)
      result.current.publishCursor(0.1, 0.2)
    })
    expect(mocks.handle.publishCursor).toHaveBeenCalledTimes(1)
    expect(mocks.handle.publishCursor).toHaveBeenCalledWith({ profileId: "p1", page: 2, x: 0.1, y: 0.2, drawing: true })
  })

  it("closes the channel on unmount", () => {
    const { unmount } = mount()
    unmount()
    expect(mocks.handle.close).toHaveBeenCalledTimes(1)
  })
})
