import { describe, expect, it } from "vitest"
import { distance, midpoint, panDelta, pinchScale } from "@shared/utils/pointer-gesture"

describe("pointer gesture math (g4)", () => {
  it("measures the distance and midpoint between two pointers", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
  })

  it("pinch scale is 1 when the pointers have not moved", () => {
    const p: [{ x: number; y: number }, { x: number; y: number }] = [{ x: 0, y: 0 }, { x: 10, y: 0 }]
    expect(pinchScale(p, p)).toBe(1)
  })

  it("doubles when the pointers spread to twice the distance", () => {
    const start: [{ x: number; y: number }, { x: number; y: number }] = [{ x: 0, y: 0 }, { x: 10, y: 0 }]
    const current: [{ x: number; y: number }, { x: number; y: number }] = [{ x: 0, y: 0 }, { x: 20, y: 0 }]
    expect(pinchScale(start, current)).toBe(2)
  })

  it("never divides by zero when the two starting pointers coincide", () => {
    const same = { x: 5, y: 5 }
    expect(pinchScale([same, same], [{ x: 0, y: 0 }, { x: 10, y: 10 }])).toBe(1)
  })

  it("pan delta is how far the point moved", () => {
    expect(panDelta({ x: 10, y: 10 }, { x: 4, y: 25 })).toEqual({ x: -6, y: 15 })
  })
})
