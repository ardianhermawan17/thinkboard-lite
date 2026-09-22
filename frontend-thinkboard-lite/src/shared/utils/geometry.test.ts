import { describe, expect, it } from "vitest"
import {
  denormalizePoint,
  denormalizeRect,
  displaySize,
  normalizePoint,
  normalizeRect,
  type Rect,
  type Rotation,
} from "@shared/utils/geometry"

const PAGE = { w: 600, h: 800 }
const ROTATIONS: Rotation[] = [0, 90, 180, 270]
const ZOOMS = [0.5, 1, 2]
// Dyadic fractions and power-of-two zooms are exact in binary floating point, so the round trip is exact, not close.
const RECTS: Rect[] = [
  { x: 0.25, y: 0.125, w: 0.5, h: 0.25 },
  { x: 0, y: 0, w: 1, h: 1 },
  { x: 0.75, y: 0.5, w: 0.125, h: 0.375 },
]

describe("geometry round trip", () => {
  for (const zoom of ZOOMS) {
    for (const rotation of ROTATIONS) {
      it(`normalize(denormalize(r)) is exact at zoom ${zoom}, rotation ${rotation}`, () => {
        const size = displaySize(PAGE, zoom, rotation)
        for (const rect of RECTS) {
          expect(normalizeRect(denormalizeRect(rect, size, rotation), size, rotation)).toEqual(rect)
        }
      })
    }
  }

  it("round-trips arbitrary values within float tolerance", () => {
    const rect: Rect = { x: 0.1234, y: 0.4321, w: 0.2222, h: 0.3333 }
    for (const rotation of ROTATIONS) {
      const size = displaySize(PAGE, 1.7, rotation)
      const back = normalizeRect(denormalizeRect(rect, size, rotation), size, rotation)
      expect(back.x).toBeCloseTo(rect.x, 10)
      expect(back.y).toBeCloseTo(rect.y, 10)
      expect(back.w).toBeCloseTo(rect.w, 10)
      expect(back.h).toBeCloseTo(rect.h, 10)
    }
  })
})

describe("geometry meaning", () => {
  it("swaps the displayed width and height at 90 and 270 only", () => {
    expect(displaySize(PAGE, 2, 0)).toEqual({ w: 1200, h: 1600 })
    expect(displaySize(PAGE, 2, 90)).toEqual({ w: 1600, h: 1200 })
    expect(displaySize(PAGE, 2, 180)).toEqual({ w: 1200, h: 1600 })
    expect(displaySize(PAGE, 2, 270)).toEqual({ w: 1600, h: 1200 })
  })

  it("keeps the same highlight on the same content when zoom changes (a stored rect never holds pixels)", () => {
    const rect: Rect = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }
    const at1 = denormalizeRect(rect, displaySize(PAGE, 1, 0), 0)
    const at2 = denormalizeRect(rect, displaySize(PAGE, 2, 0), 0)
    expect(at2).toEqual({ x: at1.x * 2, y: at1.y * 2, w: at1.w * 2, h: at1.h * 2 })
  })

  it("moves the unrotated top-left corner to the displayed top-right at 90 degrees clockwise", () => {
    const size = displaySize(PAGE, 1, 90)
    expect(denormalizePoint({ x: 0, y: 0 }, size, 90)).toEqual({ x: size.w, y: 0 })
  })

  it("moves the unrotated top-left corner to the displayed bottom-right at 180 and bottom-left at 270", () => {
    const s180 = displaySize(PAGE, 1, 180)
    expect(denormalizePoint({ x: 0, y: 0 }, s180, 180)).toEqual({ x: s180.w, y: s180.h })
    const s270 = displaySize(PAGE, 1, 270)
    expect(denormalizePoint({ x: 0, y: 0 }, s270, 270)).toEqual({ x: 0, y: s270.h })
  })

  it("normalizes a pixel point back onto the unrotated page", () => {
    const size = displaySize(PAGE, 1, 90)
    expect(normalizePoint({ x: size.w, y: 0 }, size, 90)).toEqual({ x: 0, y: 0 })
  })

  it("always returns a non-negative rect, whichever corner comes first", () => {
    const size = displaySize(PAGE, 1, 180)
    const r = denormalizeRect({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 }, size, 180)
    expect(r.w).toBeGreaterThan(0)
    expect(r.h).toBeGreaterThan(0)
  })
})
