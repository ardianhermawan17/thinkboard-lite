import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const useHighlightsForPage = vi.fn<(a: unknown, p: unknown) => unknown[]>(() => [])
vi.mock("@feature/entities/queries/use-highlights-for-page", () => ({ useHighlightsForPage: (a: unknown, p: unknown) => useHighlightsForPage(a, p) }))

import { useHighlightedPage } from "./use-highlighted-page"

const PROPS = { artifactId: "artifact-1" as never, profileId: "profile-1", pageNumber: 3, doc: {} as never, zoom: 1, rotation: 0 as const, onZoomCommit: vi.fn() }

afterEach(() => vi.clearAllMocks())

describe("useHighlightedPage (g4)", () => {
  it("has no text-layer info until page-stage reports one rendered", () => {
    const { result } = renderHook(() => useHighlightedPage(PROPS))
    expect(result.current.textLayer).toBeNull()
  })

  it("maps stored rows with a valid bbox into StoredHighlight[], dropping malformed ones", () => {
    useHighlightsForPage.mockReturnValue([
      { id: "h1", bbox: { page: 3, rects: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.02 }], color: null, tool: "text_layer" } },
      { id: "h2", bbox: null },
      { id: "h3", bbox: { page: 3 } }, // malformed: missing rects
    ])
    const { result } = renderHook(() => useHighlightedPage(PROPS))
    expect(result.current.highlights).toHaveLength(1)
    expect(result.current.highlights[0].id).toBe("h1")
    expect(typeof result.current.highlights[0].color).toBe("string")
  })

  it("queries by this page's artifact and page number", () => {
    renderHook(() => useHighlightedPage(PROPS))
    expect(useHighlightsForPage).toHaveBeenCalledWith("artifact-1", 3)
  })
})
