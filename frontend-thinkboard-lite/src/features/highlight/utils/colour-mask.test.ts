import { describe, expect, it } from "vitest"
import { connectedBoxes, isHighlighterPixel, maskFromRgba, mergeLineBoxes, rgbToHsv } from "./colour-mask"

function image(width: number, height: number, paint: (x: number, y: number) => [number, number, number]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = paint(x, y)
      const o = (y * width + x) * 4
      data[o] = r
      data[o + 1] = g
      data[o + 2] = b
      data[o + 3] = 255
    }
  }
  return data
}

const inBox = (x: number, y: number, b: { x: number; y: number; w: number; h: number }) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h

describe("colour mask (g2, g3)", () => {
  it("reads HSV and accepts the highlighter bands, rejecting white/black/blue/grey", () => {
    expect(rgbToHsv(255, 255, 0).h).toBeCloseTo(60)
    expect(isHighlighterPixel(255, 255, 0)).toBe(true) // yellow
    expect(isHighlighterPixel(0, 255, 0)).toBe(true) // green
    expect(isHighlighterPixel(0, 255, 255)).toBe(true) // cyan
    expect(isHighlighterPixel(255, 0, 255)).toBe(true) // pink
    expect(isHighlighterPixel(255, 255, 255)).toBe(false)
    expect(isHighlighterPixel(0, 0, 0)).toBe(false)
    expect(isHighlighterPixel(0, 0, 255)).toBe(false)
    expect(isHighlighterPixel(128, 128, 128)).toBe(false)
  })

  it("finds a highlighter rectangle as one connected box", () => {
    const target = { x: 10, y: 5, w: 30, h: 10 }
    const data = image(60, 40, (x, y) => (inBox(x, y, target) ? [255, 255, 0] : [255, 255, 255]))
    expect(connectedBoxes(maskFromRgba(data, 60, 40), 60, 40)).toEqual([target])
  })

  it("drops a speck smaller than 20px wide or 8px tall", () => {
    const data = image(60, 40, (x, y) => (x < 10 && y < 10 ? [255, 255, 0] : [255, 255, 255]))
    expect(connectedBoxes(maskFromRgba(data, 60, 40), 60, 40)).toEqual([])
  })

  it("merges boxes sharing more than 60% of their vertical span", () => {
    expect(mergeLineBoxes([{ x: 0, y: 0, w: 10, h: 10 }, { x: 12, y: 0, w: 10, h: 10 }])).toEqual([{ x: 0, y: 0, w: 22, h: 10 }])
    expect(mergeLineBoxes([{ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 40, w: 10, h: 10 }])).toHaveLength(2)
  })
})
