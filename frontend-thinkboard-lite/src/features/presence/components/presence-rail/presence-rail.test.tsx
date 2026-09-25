import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ state: {} as Record<string, unknown> }))
vi.mock("./use-presence-rail", () => ({ usePresenceRail: () => mocks.state }))

import { PresenceRail } from "./presence-rail"

afterEach(cleanup)

describe("PresenceRail (g2)", () => {
  it("says 'Only you' with no peers and no badge when nobody draws", () => {
    mocks.state = { peers: [], leaderDrawing: false, leaderId: null }
    render(<PresenceRail />)
    expect(screen.getByTestId("presence-rail").textContent).toContain("Only you")
    expect(screen.queryByText(/leader is drawing/i)).toBeNull()
  })

  it("counts the peers and shows the leader badge while the leader draws", () => {
    mocks.state = { peers: [{ profileId: "p2", page: 1 }, { profileId: "p3", page: 2 }], leaderDrawing: true, leaderId: "pL" }
    render(<PresenceRail />)
    expect(screen.getByTestId("presence-rail").textContent).toContain("2 here")
    expect(screen.getByText(/leader is drawing/i)).toBeTruthy()
  })
})
