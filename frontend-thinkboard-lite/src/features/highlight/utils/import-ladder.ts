import { recognizeRegion } from "@shared/lib/ocr"
import { normalizeRect, type Rect, type Rotation } from "@shared/utils/geometry"
import { regionsFromAnnotations, type PdfAnnotation, type ViewportLike } from "./annotation-quads"
import { connectedBoxes, maskFromRgba } from "./colour-mask"
import { intersectText, normalizeTextBoxes, type TextItemBox } from "./text-in-region"

// The import ladder (spec §5.4, leader import of an already-highlighted PDF). Build rung 1 first: it is the
// common case and costs almost nothing. OCR is last and crops only (RULE-19).
export type ImportCandidate = {
  /** 032: the page this region is on, so a multi-page import writes each region to its own page. */
  page: number
  rects: Rect[]
  text: string
  extraction: "text_layer" | "ocr"
  confidence: number
}

export type RasterImage = { data: Uint8ClampedArray; width: number; height: number }

export type RegionRecognizer = (source: CanvasImageSource, crop: Rect) => Promise<{ text: string; confidence: number }>

/** Rung 1: exact annotation geometry, exact text from the layer, never OCR. */
export function annotationCandidates(annotations: PdfAnnotation[], viewport: ViewportLike, page: number, rotation: Rotation, textBoxes: TextItemBox[]): ImportCandidate[] {
  const boxes = normalizeTextBoxes(textBoxes, { w: viewport.width, h: viewport.height }, rotation)
  return regionsFromAnnotations(annotations, viewport, rotation).map((region) => ({
    page,
    rects: region.rects,
    text: region.text || intersectText(boxes, region.rects),
    extraction: "text_layer",
    confidence: 1,
  }))
}

function boxesOf(image: RasterImage) {
  return connectedBoxes(maskFromRgba(image.data, image.width, image.height), image.width, image.height)
}

/** Rung 2: a flattened highlight. The mask finds the boxes; the text layer makes them exact (zero OCR). */
export function flattenedCandidates(image: RasterImage, page: number, rotation: Rotation, textBoxes: TextItemBox[]): ImportCandidate[] {
  const size = { w: image.width, h: image.height }
  const boxes = normalizeTextBoxes(textBoxes, size, rotation)
  return boxesOf(image).map((box) => {
    const rect = normalizeRect({ x: box.x, y: box.y, w: box.w, h: box.h }, size, rotation)
    return { page, rects: [rect], text: intersectText(boxes, [rect]), extraction: "text_layer" as const, confidence: 1 }
  })
}

/**
 * Rung 3: a scan. The same mask finds the boxes; there is no exact text, so each crop goes to 011's cropped OCR
 * seam and keeps its raw confidence. The 0.70 gate is derived (`confidence-gate.ts`), applied by the Result.
 */
export async function scanCandidates(image: RasterImage, source: CanvasImageSource, page: number, rotation: Rotation, recognize: RegionRecognizer = recognizeRegion): Promise<ImportCandidate[]> {
  const size = { w: image.width, h: image.height }
  return Promise.all(
    boxesOf(image).map(async (box) => {
      const crop: Rect = { x: box.x, y: box.y, w: box.w, h: box.h }
      const { text, confidence } = await recognize(source, crop)
      return { page, rects: [normalizeRect(crop, size, rotation)], text, extraction: "ocr" as const, confidence }
    })
  )
}
