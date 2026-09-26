import { normalizeRect, type Rect, type Rotation } from "@shared/utils/geometry"

// Rung 1 of the import ladder (spec §5.4): a real PDF annotation is exact geometry, so it never reaches OCR.
// PDF rects are bottom-left, Y-up; every one goes through viewport.convertToViewportRectangle() or the mark
// mirrors. A multi-line annotation carries several quads and becomes ONE region with several rects.

/** The slice of pdfjs `AnnotationData` this ladder reads. */
export type PdfAnnotation = {
  subtype?: string
  rect?: number[]
  quadPoints?: number[]
  contents?: string
}

/** The slice of a pdfjs `PageViewport` rung 1 needs. */
export type ViewportLike = {
  width: number
  height: number
  convertToViewportRectangle(rect: number[]): number[]
}

/** The slice of a real pdfjs `PageViewport` (v6 no longer exposes `convertToViewportRectangle`). */
export type PointViewportLike = {
  width: number
  height: number
  convertToViewportPoint(x: number, y: number): number[]
}

/** Adapts a real pdfjs viewport to `ViewportLike` by mapping the rect's two opposite corners and keeping min/max. */
export function viewportLike(viewport: PointViewportLike): ViewportLike {
  return {
    width: viewport.width,
    height: viewport.height,
    convertToViewportRectangle: ([x1, y1, x2, y2]) => {
      const [ax, ay] = viewport.convertToViewportPoint(x1, y1)
      const [bx, by] = viewport.convertToViewportPoint(x2, y2)
      return [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)]
    },
  }
}

export type ImportedRegion = {
  rects: Rect[]
  /** Exact text when the page has a text layer; `contents` or "" otherwise. */
  text: string
  extraction: "text_layer"
  confidence: number
}

const isHighlight = (a: PdfAnnotation) => a.subtype === "Highlight"

/** PDF-space [x1,y1,x2,y2] -> a display-space top-left rect. */
function displayRect(pdfRect: number[], viewport: ViewportLike): Rect {
  const [a, b, c, d] = viewport.convertToViewportRectangle(pdfRect)
  return { x: Math.min(a, c), y: Math.min(b, d), w: Math.abs(c - a), h: Math.abs(d - b) }
}

/** One quad (8 numbers: UL, UR, LL, LR) -> its PDF-space bounding rect. */
function quadBounds(quad: number[]): number[] {
  const xs = [quad[0], quad[2], quad[4], quad[6]]
  const ys = [quad[1], quad[3], quad[5], quad[7]]
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

/** Rung 1: one region per `Highlight` annotation, quads flattened, normalized page-relative (RULE-17). */
export function regionsFromAnnotations(annotations: PdfAnnotation[], viewport: ViewportLike, rotation: Rotation): ImportedRegion[] {
  const size = { w: viewport.width, h: viewport.height }
  const regions: ImportedRegion[] = []
  for (const annotation of annotations) {
    if (!isHighlight(annotation)) continue
    const quads = annotation.quadPoints ?? []
    const rects: Rect[] = []
    for (let i = 0; i + 8 <= quads.length; i += 8) rects.push(normalizeRect(displayRect(quadBounds(quads.slice(i, i + 8)), viewport), size, rotation))
    // A malformed/no-QuadPoints annotation falls back to its own rect rather than being dropped.
    if (rects.length === 0 && annotation.rect) rects.push(normalizeRect(displayRect(annotation.rect, viewport), size, rotation))
    if (rects.length > 0) regions.push({ rects, text: annotation.contents?.trim() ?? "", extraction: "text_layer", confidence: 1 })
  }
  return regions
}
