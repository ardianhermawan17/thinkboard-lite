import { describe, expect, it } from "vitest"
import { textBoxesFromViewport } from "./pdf-text-boxes"

describe("textBoxesFromViewport (g2)", () => {
  // A viewport that flips Y (PDF is Y-up, display is Y-down) for a 100x200 page.
  const viewport = { transform: [1, 0, 0, -1, 0, 200] }

  it("composes the item transform with the viewport to a display-space box", () => {
    const [box] = textBoxesFromViewport([{ str: "Cost", transform: [1, 0, 0, 1, 10, 180], width: 20, height: 10 }], viewport)
    // x = 1*10 + 0*180 + 0 = 10 ; y = 0*10 + (-1)*180 + 200 = 20 ; top = 20 - 10
    expect(box).toEqual({ text: "Cost", rect: { x: 10, y: 10, w: 20, h: 10 } })
  })

  it("drops blank items and items without a transform", () => {
    const items = [{ str: "  " }, { str: "x" }, { str: "y", transform: [1, 0, 0, 1, 0, 0], width: 5, height: 5 }]
    expect(textBoxesFromViewport(items, viewport)).toHaveLength(1)
  })

  it("returns nothing when the viewport has no transform", () => {
    expect(textBoxesFromViewport([{ str: "x", transform: [1, 0, 0, 1, 0, 0] }], { transform: [] })).toEqual([])
  })
})
