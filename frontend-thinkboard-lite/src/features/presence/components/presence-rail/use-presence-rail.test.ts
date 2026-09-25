import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  context: { profileId: "p1", sessionId: "s1" } as { profileId: string | null; sessionId: string | null },
  members: [] as unknown[],
  usePresence: vi.fn((_args: unknown) => ({ peers: [{ profileId: "p2", page: 1 }], leaderDrawing: true, publishCursor: vi.fn() })),
}))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock("@feature/entities", () => ({ META: { members: "members" }, useMeta: () => ({ value: mocks.members }) }))
vi.mock("../../use-presence", () => ({ usePresence: (args: unknown) => mocks.usePresence(args) }))

import { usePresenceRail } from "./use-presence-rail"

afterEach(() => {
  mocks.context = { profileId: "p1", sessionId: "s1" }
  mocks.members = []
  vi.clearAllMocks()
})

describe("usePresenceRail (g2)", () => {
  it("resolves the leader from the roster and passes it to usePresence", () => {
    mocks.members = [
      { profile_id: "p2", role: "member" },
      { profile_id: "pL", role: "leader" },
    ]
    const { result } = renderHook(() => usePresenceRail())
    expect(result.current.leaderId).toBe("pL")
    expect(mocks.usePresence).toHaveBeenCalledWith({ sessionId: "s1", profileId: "p1", page: 0, leaderId: "pL" })
  })

  it("exposes the peers and the leader-drawing flag", () => {
    const { result } = renderHook(() => usePresenceRail())
    expect(result.current.peers).toEqual([{ profileId: "p2", page: 1 }])
    expect(result.current.leaderDrawing).toBe(true)
    expect(result.current.leaderId).toBeNull()
  })

  it("passes empty ids when there is no session (the hook then opens no channel)", () => {
    mocks.context = { profileId: null, sessionId: null }
    renderHook(() => usePresenceRail())
    expect(mocks.usePresence).toHaveBeenCalledWith({ sessionId: "", profileId: "", page: 0, leaderId: null })
  })
})
