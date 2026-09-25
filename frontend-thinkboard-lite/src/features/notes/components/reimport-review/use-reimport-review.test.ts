import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  context: { profileId: "p1", sessionId: "s1" } as { profileId: string | null; sessionId: string | null },
  highlights: [] as unknown[],
  notes: [] as unknown[],
  updateNote: vi.fn(async () => ({})),
  insertNote: vi.fn(async () => ({})),
}))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock("@feature/entities/queries/use-highlights-for-session", () => ({ useHighlightsForSession: () => mocks.highlights }))
vi.mock("@feature/entities/queries/use-notes-for-session", () => ({ useNotesForSession: () => mocks.notes }))
vi.mock("@feature/entities/repository/note-repository", () => ({ updateNote: mocks.updateNote, insertNote: mocks.insertNote }))

import { useReimportReview } from "./use-reimport-review"

const SLUG = "h-p01-01-aaaaaa"
const MD = `## p.1 · Cost\n<!-- tb id=${SLUG} page=1 rect= layer=individual extraction=text_layer -->\n\n> Cost basis\n\nmy note\n`
const ORPHAN_MD = "## p.2 · Mystery\n<!-- tb id=h-p99-99-zzzzzz page=2 rect= layer=group extraction=ocr -->\n\n> ?\n"

beforeEach(() => {
  mocks.context = { profileId: "p1", sessionId: "s1" }
  mocks.highlights = [{ id: "h1", slug: SLUG }]
  mocks.notes = []
})
afterEach(() => vi.clearAllMocks())

describe("useReimportReview (g1, g2)", () => {
  it("plans the pasted markdown against the workspace's slugs", () => {
    const { result } = renderHook(() => useReimportReview())
    act(() => result.current.setMarkdown(MD))
    expect(result.current.plan).toEqual({ matched: 1, unanchored: 0, orphans: 0, missing: 0 })
    expect(result.current.applied).toBeNull()
  })

  it("updates the author's existing matched note once, never inserting", async () => {
    mocks.notes = [{ id: "n1", highlightId: "h1", profileId: "p1", content: "old text" }]
    const { result } = renderHook(() => useReimportReview())
    act(() => result.current.setMarkdown(MD))
    await act(async () => {
      await result.current.apply()
    })
    expect(mocks.updateNote).toHaveBeenCalledWith("n1", { content: "my note" })
    expect(mocks.insertNote).not.toHaveBeenCalled()
    expect(result.current.applied).toBe(1)
  })

  it("inserts a note when the matched highlight has none", async () => {
    const { result } = renderHook(() => useReimportReview())
    act(() => result.current.setMarkdown(MD))
    await act(async () => {
      await result.current.apply()
    })
    expect(mocks.insertNote).toHaveBeenCalledWith({ highlightId: "h1", profileId: "p1", content: "my note" })
    expect(mocks.updateNote).not.toHaveBeenCalled()
  })

  it("is a no-op when re-applying identical content", async () => {
    mocks.notes = [{ id: "n1", highlightId: "h1", profileId: "p1", content: "my note" }]
    const { result } = renderHook(() => useReimportReview())
    act(() => result.current.setMarkdown(MD))
    await act(async () => {
      await result.current.apply()
    })
    expect(mocks.updateNote).not.toHaveBeenCalled()
    expect(mocks.insertNote).not.toHaveBeenCalled()
    expect(result.current.applied).toBe(1)
  })

  it("reports an unknown slug as an orphan and writes nothing for it", async () => {
    const { result } = renderHook(() => useReimportReview())
    act(() => result.current.setMarkdown(ORPHAN_MD))
    // the known slug does not appear in the file, so it is also reported missing
    expect(result.current.plan).toEqual({ matched: 0, unanchored: 0, orphans: 1, missing: 1 })
    await act(async () => {
      await result.current.apply()
    })
    expect(mocks.insertNote).not.toHaveBeenCalled()
    expect(mocks.updateNote).not.toHaveBeenCalled()
  })
})
