import { describe, expect, it } from "vitest"
import { intersectText, normalizeTextBoxes, type TextItemBox } from "./text-in-region"

const boxes: TextItemBox[] = [
  { text: "Cost", rect: { x: 10, y: 20, w: 20, h: 8 } },
  { text: "basis", rect: { x: 32, y: 20, w: 20, h: 8 } },
  { text: "elsewhere", rect: { x: 200, y: 20, w: 40, h: 8 } },
]

describe("intersectText (g1, g2)", () => {
  it("joins the overlapping items in reading order", () => {
    expect(intersectText(boxes, [{ x: 5, y: 15, w: 60, h: 20 }])).toBe("Cost basis")
  })

  it("returns empty when nothing overlaps", () => {
    expect(intersectText(boxes, [{ x: 300, y: 300, w: 10, h: 10 }])).toBe("")
  })

  it("orders top-to-bottom then left-to-right across lines", () => {
    const two: TextItemBox[] = [
      { text: "second", rect: { x: 0, y: 40, w: 10, h: 8 } },
      { text: "first-b", rect: { x: 20, y: 10, w: 10, h: 8 } },
      { text: "first-a", rect: { x: 0, y: 10, w: 10, h: 8 } },
    ]
    expect(intersectText(two, [{ x: 0, y: 0, w: 100, h: 100 }])).toBe("first-a first-b second")
  })

  it("normalizes display boxes into page space before intersecting", () => {
    const [normalized] = normalizeTextBoxes([{ text: "x", rect: { x: 10, y: 20, w: 20, h: 10 } }], { w: 100, h: 200 }, 0)
    expect(normalized.rect.x).toBeCloseTo(0.1)
    expect(normalized.rect.y).toBeCloseTo(0.1)
    expect(normalized.rect.w).toBeCloseTo(0.2)
    expect(normalized.rect.h).toBeCloseTo(0.05)
  })
})
