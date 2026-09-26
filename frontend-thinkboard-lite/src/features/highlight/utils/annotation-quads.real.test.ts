// @vitest-environment node
import { PDFDocument, PDFName, StandardFonts } from "pdf-lib"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import { describe, expect, it } from "vitest"
import { regionsFromAnnotations, viewportLike, type PdfAnnotation } from "./annotation-quads"
import { annotationCandidates } from "./import-ladder"
import { textBoxesFromViewport, type PdfTextItemLike } from "./pdf-text-boxes"

// 021/032's real-document check. The parser had only ever seen hand-written annotation objects; this builds an
// actual PDF with text and a two-quad /Highlight (plus a non-highlight), reads it back through the real pdfjs
// annotation + text layers that `use-import-source` calls, and runs rung 1 over pdfjs's own output shape.

async function annotatedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([200, 200])
  page.drawText("Highlighted line", { x: 10, y: 168, size: 10, font: await doc.embedFont(StandardFonts.Helvetica) })
  const highlight = doc.context.obj({
    Type: "Annot",
    Subtype: "Highlight",
    Rect: [10, 138, 60, 180],
    QuadPoints: [10, 180, 60, 180, 10, 168, 60, 168, 10, 150, 60, 150, 10, 138, 60, 138],
    C: [1, 1, 0],
    T: "Reviewer",
    Contents: "A note",
    F: 4,
  })
  const square = doc.context.obj({ Type: "Annot", Subtype: "Square", Rect: [10, 10, 60, 30], F: 4 })
  page.node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(highlight), doc.context.register(square)]))
  return doc.save()
}

describe("rung 1 against a real pdfjs document (021/032)", () => {
  it("reads a real two-quad Highlight's geometry and its exact text-layer text", async () => {
    const pdf = await getDocument({ data: await annotatedPdf() }).promise
    const page = await pdf.getPage(1)
    const annotations = (await page.getAnnotations()) as unknown as PdfAnnotation[]
    const viewport = page.getViewport({ scale: 1 })

    expect(annotations.map((a) => a.subtype)).toContain("Highlight")
    const [region, ...rest] = regionsFromAnnotations(annotations, viewportLike(viewport), 0)
    expect(rest).toHaveLength(0) // the Square is not a highlight
    expect(region.rects).toHaveLength(2) // a real multi-quad highlight must not collapse to its rect
    expect(region.rects[0].x).toBeCloseTo(0.05)
    expect(region.rects[0].y).toBeCloseTo(0.1)
    expect(region.rects[0].w).toBeCloseTo(0.25)
    expect(region.rects[0].h).toBeCloseTo(0.06)
    expect(region.rects[1].y).toBeCloseTo(0.25)

    const content = await page.getTextContent()
    const boxes = textBoxesFromViewport(content.items as unknown as PdfTextItemLike[], { transform: viewport.transform })
    const [candidate] = annotationCandidates(annotations, viewportLike(viewport), 1, 0, boxes)
    expect(candidate.extraction).toBe("text_layer") // RULE-19: never OCR for a real annotation
    expect(candidate.confidence).toBe(1)
    expect(candidate.page).toBe(1)
    expect(candidate.text).toBe("Highlighted line")
  })
})
