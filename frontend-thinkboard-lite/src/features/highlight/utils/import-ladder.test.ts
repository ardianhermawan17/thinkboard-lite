import { describe, expect, it, vi } from "vitest"
import type { ViewportLike } from "./annotation-quads"
import { annotationCandidates, flattenedCandidates, scanCandidates } from "./import-ladder"
import type { TextItemBox } from "./text-in-region"

const viewport: ViewportLike = { width: 100, height: 200, convertToViewportRectangle: ([x1, y1, x2, y2]) => [x1, 200 - y2, x2, 200 - y1] }

function raster(width: number, height: number, box: { x: number; y: number; w: number; h: number }) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const on = x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h
      const [r, g, b] = on ? [255, 255, 0] : [255, 255, 255]
      const o = (y * width + x) * 4
      data[o] = r
      data[o + 1] = g
      data[o + 2] = b
      data[o + 3] = 255
    }
  }
  return { data, width, height }
}

describe("import ladder (g1, g2, g3)", () => {
  it("rung 1 uses exact annotation geometry and reads exact text from the layer, with no OCR", () => {
    const boxes: TextItemBox[] = [{ text: "Cost basis", rect: { x: 10, y: 20, w: 40, h: 10 } }]
    const [candidate] = annotationCandidates([{ subtype: "Highlight", quadPoints: [10, 180, 40, 180, 10, 170, 40, 170] }], viewport, 0, boxes)
    expect(candidate.extraction).toBe("text_layer")
    expect(candidate.confidence).toBe(1)
    expect(candidate.text).toBe("Cost basis")
    expect(candidate.rects).toHaveLength(1)
  })

  it("rung 2 finds a flattened highlight by its ink and reads exact text from the layer", () => {
    const display = { x: 5, y: 2, w: 30, h: 10 }
    const boxes: TextItemBox[] = [{ text: "flattened", rect: display }]
    const [candidate] = flattenedCandidates(raster(50, 20, display), 0, boxes)
    expect(candidate.extraction).toBe("text_layer")
    expect(candidate.text).toBe("flattened")
    expect(candidate.rects[0].x).toBeCloseTo(5 / 50)
  })

  it("rung 3 crops the mask box to OCR and keeps the raw confidence", async () => {
    const display = { x: 5, y: 2, w: 30, h: 10 }
    const recognize = vi.fn(async (_source: CanvasImageSource, crop: { x: number; y: number; w: number; h: number }) => ({ text: `ocr:${crop.x}`, confidence: 0.4 }))
    const [candidate] = await scanCandidates(raster(50, 20, display), {} as CanvasImageSource, 0, recognize)
    expect(candidate.extraction).toBe("ocr")
    expect(candidate.confidence).toBe(0.4)
    expect(candidate.text).toBe("ocr:5")
    expect(recognize).toHaveBeenCalledWith({}, { x: 5, y: 2, w: 30, h: 10 })
  })
})
