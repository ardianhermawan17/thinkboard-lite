import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { displaySize, normalizeRect } from "@shared/utils/geometry"

vi.mock("./highlight-layer.painter", () => ({ paintHighlights: vi.fn(() => vi.fn()) }))

import { useHighlightLayer } from "./use-highlight-layer"

const SIZE = { w: 600, h: 800 }

describe("useHighlightLayer (g4)", () => {
  it("denormalizes a stored rect against the current size and rotation", () => {
    const { result } = renderHook(() =>
      useHighlightLayer({ highlights: [{ id: "h1", rects: [{ x: 0.25, y: 0.25, w: 0.5, h: 0.25 }], color: "gold" }], size: SIZE, rotation: 0 })
    )
    expect(result.current.rects).toEqual([{ x: 150, y: 200, w: 300, h: 200, color: "gold" }])
  })

  it("flattens multiple highlights and multiple rects per highlight into one paint list", () => {
    const { result } = renderHook(() =>
      useHighlightLayer({
        highlights: [
          { id: "h1", rects: [{ x: 0, y: 0, w: 0.1, h: 0.1 }], color: "red" },
          {
            id: "h2",
            rects: [
              { x: 0.2, y: 0.2, w: 0.1, h: 0.1 },
              { x: 0.3, y: 0.3, w: 0.1, h: 0.1 },
            ],
            color: "blue",
          },
        ],
        size: SIZE,
        rotation: 0,
      })
    )
    expect(result.current.rects).toHaveLength(3)
    expect(result.current.rects.filter((r) => r.color === "blue")).toHaveLength(2)
  })

  it("is empty before the page has a real size, so an unmounted page never paints stale pixels", () => {
    const { result } = renderHook(() => useHighlightLayer({ highlights: [{ id: "h1", rects: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.1 }], color: "red" }], size: { w: 0, h: 0 }, rotation: 0 }))
    expect(result.current.rects).toEqual([])
  })

  it("is empty when there are no stored highlights on the page", () => {
    const { result } = renderHook(() => useHighlightLayer({ highlights: [], size: SIZE, rotation: 0 }))
    expect(result.current.rects).toEqual([])
  })

  it("respects rotation, via the same geometry the page-stage leaf already uses", () => {
    const rotatedSize = { w: 800, h: 600 }
    const { result } = renderHook(() => useHighlightLayer({ highlights: [{ id: "h1", rects: [{ x: 0, y: 0, w: 0.1, h: 0.1 }], color: "red" }], size: rotatedSize, rotation: 90 }))
    expect(result.current.rects[0].x).toBeGreaterThanOrEqual(0)
    expect(result.current.rects[0].y).toBeGreaterThanOrEqual(0)
  })

  it("g5: a highlight stored once lands on the same content at three zoom levels and after rotation", () => {
    const PAGE = { w: 600, h: 800 }
    const stored = { x: 0.25, y: 0.125, w: 0.5, h: 0.25 } // what insertHighlight actually persists
    for (const zoom of [0.5, 1, 2]) {
      for (const rotation of [0, 90, 180, 270] as const) {
        const size = displaySize(PAGE, zoom, rotation)
        const { result } = renderHook(() => useHighlightLayer({ highlights: [{ id: "h1", rects: [stored], color: "gold" }], size, rotation }))
        const [painted] = result.current.rects
        // "reload": re-normalize the painted pixel rect against the same size/rotation and recover the stored rect exactly
        const recovered = normalizeRect({ x: painted.x, y: painted.y, w: painted.w, h: painted.h }, size, rotation)
        expect(recovered).toEqual(stored)
      }
    }
  })
})
