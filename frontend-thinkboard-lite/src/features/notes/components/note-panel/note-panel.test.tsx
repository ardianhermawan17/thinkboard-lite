import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ select: vi.fn(), state: {} as Record<string, unknown> }))
vi.mock("./use-note-panel", () => ({ useNotePanel: () => mocks.state }))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => ({ profileId: "p1", sessionId: "s1" }) }))
vi.mock("../note-sheet", () => ({ NoteSheet: () => <div data-testid="note-sheet" /> }))

import { NotePanel } from "./note-panel"

afterEach(cleanup)

const item = { id: "h1", text: "Cost basis", page: 3, layer: "individual" as const }

describe("NotePanel (g3)", () => {
  it("lists the highlights and selects one without opening the sheet", () => {
    mocks.state = { items: [item], selectedId: null, note: undefined, open: false, select: mocks.select, onOpenChange: vi.fn() }
    render(<NotePanel />)
    fireEvent.click(screen.getByRole("button", { name: /Cost basis/ }))
    expect(mocks.select).toHaveBeenCalledWith("h1")
    expect(screen.queryByTestId("note-sheet")).toBeNull()
  })

  it("renders the sheet when a highlight is selected", () => {
    mocks.state = { items: [item], selectedId: "h1", note: undefined, open: true, select: mocks.select, onOpenChange: vi.fn() }
    render(<NotePanel />)
    expect(screen.getByTestId("note-sheet")).toBeTruthy()
  })

  it("invites a first highlight when there are none", () => {
    mocks.state = { items: [], selectedId: null, note: undefined, open: false, select: mocks.select, onOpenChange: vi.fn() }
    render(<NotePanel />)
    expect(screen.getByText(/add a highlight and a note/i)).toBeTruthy()
  })
})
