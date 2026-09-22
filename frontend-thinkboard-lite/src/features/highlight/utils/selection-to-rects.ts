import { normalizeRect, type Rect, type Rotation, type Size } from "@shared/utils/geometry"

const MIN_DIMENSION = 0.5 // px; drops the zero-width rect a collapsed selection can still report

/**
 * A text selection -> page-relative normalized rects, one per visual line (spec 5.4: "Real text
 * selection needs the PDF.js text layer, which is DOM"). `container` is z1's own element, so every
 * rect is measured against the same box `shared/utils/geometry` normalizes against -- never the
 * browser viewport, which would smuggle in scroll position and other pages (RULE-17).
 */
export function selectionToRects(range: Range, container: HTMLElement, size: Size, rotation: Rotation): Rect[] {
  const containerBox = container.getBoundingClientRect()
  const rects: Rect[] = []
  for (const client of range.getClientRects()) {
    if (client.width < MIN_DIMENSION || client.height < MIN_DIMENSION) continue
    const pixelRect = { x: client.left - containerBox.left, y: client.top - containerBox.top, w: client.width, h: client.height }
    rects.push(normalizeRect(pixelRect, size, rotation))
  }
  return rects
}

/** The exact string PDF.js's text layer gives for free (extraction='text_layer', confidence=1.0). */
export function selectionText(selection: Selection): string {
  return selection.toString().trim()
}
