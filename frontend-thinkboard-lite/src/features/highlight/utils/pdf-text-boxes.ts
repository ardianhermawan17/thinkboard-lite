import type { TextItemBox } from "./text-in-region"

export type PdfTextItemLike = { str?: string; transform?: number[]; width?: number; height?: number }
export type ViewportTransform = { transform: number[] }

/**
 * 032: pdfjs text items are in PDF space; the viewport transform maps them to display space. Compose the two
 * with the same matrix multiplication pdfjs's `Util.transform` does, so the boxes share the space the region
 * rects live in (the text-layer intersect needs one space).
 */
export function textBoxesFromViewport(items: PdfTextItemLike[], viewport: ViewportTransform): TextItemBox[] {
  const t = viewport.transform
  if (!Array.isArray(t) || t.length < 6) return []
  const [a, b, c, d, e, f] = t
  return items.flatMap((item) => {
    const text = item.str ?? ""
    const tr = item.transform
    if (!text.trim() || !Array.isArray(tr) || tr.length < 6) return []
    const [ta, tb, tc, td, te, tf] = tr
    const x = a * te + c * tf + e
    const y = b * te + d * tf + f
    const width = item.width ?? 0
    const height = item.height ?? 0
    return [{ text, rect: { x, y: y - height, w: width, h: height } }]
  })
}
