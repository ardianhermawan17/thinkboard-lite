import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { WorkspaceProvider } from "@shared/providers/workspace-provider"

// The two panels read the store and Dexie; this test is about the rail's own fold/unfold.
vi.mock("../members", () => ({ Members: () => <div data-testid="members" /> }))
vi.mock("../persona-editor", () => ({ PersonaEditor: () => <div data-testid="persona-editor" /> }))

import { PeopleRail } from "./people-rail"

afterEach(cleanup)

const renderRail = () =>
  render(
    <WorkspaceProvider profileId="p1" sessionId="s1">
      <PeopleRail />
    </WorkspaceProvider>
  )

describe("PeopleRail (043)", () => {
  it("folds from the chevron beside its tabs and comes back from the handle", () => {
    renderRail()
    const rail = screen.getByTestId("people-rail")
    const panel = screen.getByTestId("people-rail-panel")
    expect(rail.className).toContain("w-80")
    expect(panel.getAttribute("aria-hidden")).toBe("false")
    expect(screen.getByTestId("members")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Hide the people rail" }))
    // the rail stays mounted and slides: the width collapses, the panel is inert, and the handle takes over
    expect(rail.className).toContain("w-11")
    expect(panel.getAttribute("aria-hidden")).toBe("true")
    expect(panel.hasAttribute("inert")).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: "Show the people rail" }))
    expect(rail.className).toContain("w-80")
    expect(panel.getAttribute("aria-hidden")).toBe("false")
    expect(panel.hasAttribute("inert")).toBe(false)
  })
})
