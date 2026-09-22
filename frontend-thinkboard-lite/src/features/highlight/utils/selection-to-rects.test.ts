import { describe, expect, it } from "vitest"
import { selectionText, selectionToRects } from "./selection-to-rects"

// jsdom does no real layout, so getClientRects()/getBoundingClientRect() are stubbed with the geometry
// a real PDF.js text layer would report: container at (0,0) 600x800, a two-line selection inside it.
function fakeRect(x: number, y: number, w: number, h: number): DOMRect {
  return { x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }
}

function stubbedRange(lines: DOMRect[]): Range {
  const range = document.createRange()
  Object.defineProperty(range, "getClientRects", { value: () => lines })
  return range
}

function stubbedContainer(box: DOMRect): HTMLElement {
  const el = document.createElement("div")
  Object.defineProperty(el, "getBoundingClientRect", { value: () => box })
  return el
}

const SIZE = { w: 600, h: 800 }
const CONTAINER_BOX = fakeRect(0, 0, 600, 800)

function expectRectCloseTo(actual: { x: number; y: number; w: number; h: number }, expected: { x: number; y: number; w: number; h: number }) {
  expect(actual.x).toBeCloseTo(expected.x, 10)
  expect(actual.y).toBeCloseTo(expected.y, 10)
  expect(actual.w).toBeCloseTo(expected.w, 10)
  expect(actual.h).toBeCloseTo(expected.h, 10)
}

describe("selectionToRects (g1)", () => {
  it("converts a single-line selection to one normalized rect", () => {
    const range = stubbedRange([fakeRect(60, 200, 480, 20)])
    const rects = selectionToRects(range, stubbedContainer(CONTAINER_BOX), SIZE, 0)
    expect(rects).toHaveLength(1)
    expectRectCloseTo(rects[0], { x: 0.1, y: 0.25, w: 0.8, h: 0.025 })
  })

  it("flattens a multi-line selection into several rects, one per PDF.js line box", () => {
    const range = stubbedRange([fakeRect(60, 200, 480, 20), fakeRect(60, 220, 300, 20)])
    const rects = selectionToRects(range, stubbedContainer(CONTAINER_BOX), SIZE, 0)
    expect(rects).toHaveLength(2)
    expect(rects.every((r) => r.x >= 0 && r.x <= 1 && r.y >= 0 && r.y <= 1)).toBe(true)
  })

  it("measures against the text-layer container, not the browser viewport", () => {
    const scrolledContainer = stubbedContainer(fakeRect(-40, -500, 600, 800)) // page scrolled up-left
    const range = stubbedRange([fakeRect(20, -300, 480, 20)]) // client-absolute
    const rects = selectionToRects(range, scrolledContainer, SIZE, 0)
    // relative to the container: (20 - -40, -300 - -500) = (60, 200), matching the single-line case above
    expect(rects).toHaveLength(1)
    expectRectCloseTo(rects[0], { x: 0.1, y: 0.25, w: 0.8, h: 0.025 })
  })

  it("drops a collapsed selection's zero-size rect", () => {
    const range = stubbedRange([fakeRect(60, 200, 0, 0)])
    expect(selectionToRects(range, stubbedContainer(CONTAINER_BOX), SIZE, 0)).toEqual([])
  })

  it("respects rotation, via the same geometry the page-stage leaf already uses", () => {
    const rotatedSize = { w: 800, h: 600 } // swapped, as displaySize() would report at 90 degrees
    const range = stubbedRange([fakeRect(0, 0, 100, 100)])
    const rects = selectionToRects(range, stubbedContainer(CONTAINER_BOX), rotatedSize, 90)
    expect(rects[0].x).toBeGreaterThanOrEqual(0)
    expect(rects[0].y).toBeGreaterThanOrEqual(0)
  })
})

describe("selectionText (g1)", () => {
  it("trims the exact string the Selection API reports", () => {
    const selection = { toString: () => "  Cost basis is stated in 2023 prices  \n" } as Selection
    expect(selectionText(selection)).toBe("Cost basis is stated in 2023 prices")
  })
})
