import { describe, expect, it } from "vitest"
import { regionsFromAnnotations, type ViewportLike } from "./annotation-quads"

// A viewport for a 100x200 page at scale 1: PDF is Y-up, display is Y-down (the flip rung 1 must not skip).
const viewport: ViewportLike = { width: 100, height: 200, convertToViewportRectangle: ([x1, y1, x2, y2]) => [x1, 200 - y2, x2, 200 - y1] }

function expectRect(actual: { x: number; y: number; w: number; h: number }, expected: { x: number; y: number; w: number; h: number }) {
  expect(actual.x).toBeCloseTo(expected.x)
  expect(actual.y).toBeCloseTo(expected.y)
  expect(actual.w).toBeCloseTo(expected.w)
  expect(actual.h).toBeCloseTo(expected.h)
}

describe("regionsFromAnnotations (g1)", () => {
  it("flattens a multi-quad highlight into one region with several normalized rects", () => {
    const [region] = regionsFromAnnotations([{ subtype: "Highlight", quadPoints: [10, 180, 40, 180, 10, 170, 40, 170, 10, 160, 30, 160, 10, 150, 30, 150] }], viewport, 0)
    expect(region.extraction).toBe("text_layer")
    expect(region.confidence).toBe(1)
    expect(region.rects).toHaveLength(2)
    expectRect(region.rects[0], { x: 0.1, y: 0.1, w: 0.3, h: 0.05 })
    expectRect(region.rects[1], { x: 0.1, y: 0.2, w: 0.2, h: 0.05 })
  })

  it("ignores annotations that are not highlights", () => {
    expect(regionsFromAnnotations([{ subtype: "Square", rect: [0, 0, 10, 10] }, { subtype: "Text" }], viewport, 0)).toHaveLength(0)
  })

  it("falls back to the annotation rect when QuadPoints are missing", () => {
    const [region] = regionsFromAnnotations([{ subtype: "Highlight", rect: [10, 180, 40, 170] }], viewport, 0)
    expectRect(region.rects[0], { x: 0.1, y: 0.1, w: 0.3, h: 0.05 })
  })

  it("normalizes through a rotation", () => {
    const [region] = regionsFromAnnotations([{ subtype: "Highlight", quadPoints: [10, 180, 40, 180, 10, 170, 40, 170] }], viewport, 90)
    expectRect(region.rects[0], { x: 0.1, y: 0.6, w: 0.05, h: 0.3 })
  })
})
