import { describe, expect, it } from "vitest"
import { readingOrderRank } from "./reading-order"

const r = (x: number, y: number) => ({ x, y, w: 0.1, h: 0.02 })

describe("readingOrderRank (g2)", () => {
  it("is 1 on an empty page", () => {
    expect(readingOrderRank(r(0.1, 0.1), [])).toBe(1)
  })

  it("ranks by vertical position first", () => {
    expect(readingOrderRank(r(0.1, 0.5), [r(0.1, 0.1), r(0.1, 0.3)])).toBe(3)
  })

  it("ranks left-to-right on the same line", () => {
    expect(readingOrderRank(r(0.5, 0.1), [r(0.1, 0.1)])).toBe(2)
    expect(readingOrderRank(r(0.1, 0.1), [r(0.5, 0.1)])).toBe(1)
  })

  it("is deterministic regardless of the existing array's order", () => {
    const existing = [r(0.1, 0.5), r(0.1, 0.1), r(0.1, 0.3)]
    expect(readingOrderRank(r(0.1, 0.4), existing)).toBe(3)
    expect(readingOrderRank(r(0.1, 0.4), [...existing].reverse())).toBe(3)
  })
})
