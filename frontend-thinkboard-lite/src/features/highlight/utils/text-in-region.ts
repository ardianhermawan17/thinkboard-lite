import { normalizeRect, type Rect, type Rotation } from "@shared/utils/geometry"

// The exact-text step shared by rungs 1 and 2 (spec §5.4): intersect a region with the page's text-layer
// items. Exact text means zero OCR (RULE-19). Pure: the caller builds the boxes from pdfjs text items.
export type TextItemBox = { text: string; rect: Rect }

/** Text boxes arrive in display pixels; regions are page-relative, so intersect in one space (RULE-17). */
export function normalizeTextBoxes(boxes: TextItemBox[], size: { w: number; h: number }, rotation: Rotation): TextItemBox[] {
  return boxes.map((box) => ({ text: box.text, rect: normalizeRect(box.rect, size, rotation) }))
}

function overlaps(a: Rect, b: Rect): boolean {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  return x > 0 && y > 0
}

/** The text of every item overlapping any of the region's rects, in reading order (top-to-bottom, left-to-right). */
export function intersectText(boxes: TextItemBox[], rects: Rect[]): string {
  const hit = boxes.filter((box) => rects.some((rect) => overlaps(box.rect, rect)))
  hit.sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
  return hit.map((box) => box.text).join(" ").replace(/\s+/g, " ").trim()
}
