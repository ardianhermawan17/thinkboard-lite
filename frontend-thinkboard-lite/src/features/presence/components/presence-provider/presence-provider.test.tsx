import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  context: { profileId: "p1", sessionId: "s1" },
  members: [{ profile_id: "pL", role: "leader" }] as unknown[],
  usePresence: vi.fn((_args: unknown) => ({ peers: [{ profileId: "p2", page: 1 }], leaderDrawing: false, publishCursor: vi.fn(), subscribe: vi.fn(() => () => {}) })),
}))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock("@feature/entities", () => ({ META: { members: "members" }, useMeta: () => ({ value: mocks.members }) }))
vi.mock("../../use-presence", () => ({ usePresence: (args: unknown) => mocks.usePresence(args) }))

import { PresenceProvider, usePresenceContext } from "."

afterEach(() => vi.clearAllMocks())

describe("PresenceProvider (g1)", () => {
  it("opens one channel (via usePresence) and exposes peers, the leader flag and the publisher", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <PresenceProvider>{children}</PresenceProvider>
    const { result } = renderHook(() => usePresenceContext(), { wrapper })
    expect(result.current.peers).toEqual([{ profileId: "p2", page: 1 }])
    expect(result.current.leaderDrawing).toBe(false)
    expect(result.current.leaderId).toBe("pL")
    expect(typeof result.current.publishCursor).toBe("function")
    expect(typeof result.current.subscribe).toBe("function")
    expect(mocks.usePresence).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "s1", profileId: "p1", leaderId: "pL" }))
  })

  it("throws outside a provider, so a second channel cannot be opened by accident", () => {
    expect(() => renderHook(() => usePresenceContext())).toThrow(/PresenceProvider/)
  })
})
