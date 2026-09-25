import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  context: { profileId: "p1", sessionId: "s1" } as { profileId: string | null; sessionId: string | null },
  highlights: [] as unknown[],
  notes: [] as unknown[],
}))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock("@feature/entities/queries/use-highlights-for-session", () => ({ useHighlightsForSession: () => mocks.highlights }))
vi.mock("@feature/entities/queries/use-notes-for-highlight", () => ({ useNotesForHighlight: () => mocks.notes }))

import type { HighlightRow } from "@feature/entities/types"
import { useNotePanel } from "./use-note-panel"

const H1 = "h1" as HighlightRow["id"]

afterEach(() => {
  mocks.highlights = []
  mocks.notes = []
  vi.clearAllMocks()
})

describe("useNotePanel (g3)", () => {
  it("lists the session's highlights with nothing selected", () => {
    mocks.highlights = [{ id: "h1", text: "Cost basis", page: 3, layer: "individual" }]
    const { result } = renderHook(() => useNotePanel())
    expect(result.current.items).toEqual([{ id: "h1", text: "Cost basis", page: 3, layer: "individual" }])
    expect(result.current.selectedId).toBeNull()
    expect(result.current.open).toBe(false)
  })

  it("opens for the selected highlight and clears when the sheet closes", () => {
    mocks.highlights = [{ id: "h1", text: "Cost basis", page: 3, layer: "individual" }]
    const { result } = renderHook(() => useNotePanel())
    act(() => result.current.select(H1))
    expect(result.current.selectedId).toBe("h1")
    expect(result.current.open).toBe(true)
    act(() => result.current.onOpenChange(false))
    expect(result.current.selectedId).toBeNull()
  })

  it("prefers the caller's own note and falls back to a teammate's", () => {
    mocks.highlights = [{ id: "h1", text: "Cost basis", page: 3, layer: "group" }]
    mocks.notes = [
      { id: "n-other", highlightId: "h1", profileId: "pX", content: "teammate" },
      { id: "n-mine", highlightId: "h1", profileId: "p1", content: "mine" },
    ]
    const { result } = renderHook(() => useNotePanel())
    act(() => result.current.select(H1))
    expect(result.current.note?.id).toBe("n-mine")

    mocks.context = { profileId: "pZ", sessionId: "s1" }
    const other = renderHook(() => useNotePanel())
    act(() => other.result.current.select(H1))
    expect(other.result.current.note?.id).toBe("n-other")
    mocks.context = { profileId: "p1", sessionId: "s1" }
  })
})
