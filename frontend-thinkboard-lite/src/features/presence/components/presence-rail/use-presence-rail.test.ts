import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ context: {} as Record<string, unknown> }))
vi.mock("../presence-provider", () => ({ usePresenceContext: () => mocks.context }))

import { usePresenceRail } from "./use-presence-rail"

beforeEach(() => {
  mocks.context = { peers: [{ profileId: "p2", page: 1 }], leaderDrawing: true, leaderId: "pL", publishCursor: vi.fn(), subscribe: vi.fn() }
})

describe("usePresenceRail (g2)", () => {
  it("reads peers and the leader flag from the shared presence value (no second channel)", () => {
    const { result } = renderHook(() => usePresenceRail())
    expect(result.current.peers).toEqual([{ profileId: "p2", page: 1 }])
    expect(result.current.leaderDrawing).toBe(true)
    expect(result.current.leaderId).toBe("pL")
  })
})
