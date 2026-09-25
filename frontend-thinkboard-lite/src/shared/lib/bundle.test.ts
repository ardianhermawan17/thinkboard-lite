import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName } from "pdf-lib"
import { describe, expect, it } from "vitest"
import {
  appendHighlightsToPdf,
  buildBundleZip,
  bundleFilename,
  buildManifest,
  parseNotesMarkdown,
  planReimport,
  readBundleZip,
  renderNotesMarkdown,
  type BundleHighlight,
  type BundleInput,
} from "./bundle"

const H1: BundleHighlight = { id: "h1", slug: "h-p03-01-aaaaaa", page: 3, rects: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.05 }], text: "Cost basis is stated", layer: "individual", extraction: "text_layer", confidence: 1, weight: 1 }
const H2: BundleHighlight = { id: "h2", slug: "h-p01-01-bbbbbb", page: 1, rects: [{ x: 0.2, y: 0.1, w: 0.2, h: 0.06 }], text: "Second focus", layer: "group", extraction: "ocr", confidence: 0.4, weight: 2 }

const INPUT: BundleInput = {
  sessionId: "s1",
  artifactId: "a1",
  title: "Workspace",
  goal: "Understand the tariff",
  pageCount: 3,
  highlights: [H1, H2],
  notes: [{ id: "n1", highlightId: "h1", content: "Kalau pakai angka 2023, selisihnya bisa 12%.", inputMode: "keyboard", visibility: "individual" }],
}

async function basePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([600, 800])
  doc.addPage([600, 800])
  doc.addPage([600, 800])
  return doc.save()
}

describe("notes.md anchors (g4, g5)", () => {
  it("writes one section per focus point with exactly one identity anchor", () => {
    const md = renderNotesMarkdown(INPUT)
    expect(md.match(/<!-- tb /g)).toHaveLength(2)
    expect(md).toContain("<!-- tb id=h-p03-01-aaaaaa page=3 rect=0.1,0.2,0.3,0.05 layer=individual extraction=text_layer -->")
    expect(md).toContain("## p.3 · Cost basis is stated")
    expect(md).toContain("> Cost basis is stated")
    expect(md).toContain("Kalau pakai angka 2023")
    expect(md.indexOf("h-p01-01-bbbbbb")).toBeLessThan(md.indexOf("h-p03-01-aaaaaa")) // reading order
  })

  it("round-trips slug, highlight text and note prose", () => {
    const [first, second] = parseNotesMarkdown(renderNotesMarkdown(INPUT))
    expect(first.slug).toBe("h-p01-01-bbbbbb")
    expect(first.highlightText).toBe("Second focus")
    expect(first.note).toBe("")
    expect(second.slug).toBe("h-p03-01-aaaaaa")
    expect(second.note).toContain("selisihnya")
  })

  it("export -> edit prose -> re-import creates no duplicates", () => {
    const edited = renderNotesMarkdown(INPUT).replace("selisihnya bisa 12%.", "selisihnya sekarang 14%.")
    const plan = planReimport(edited, [H1.slug, H2.slug])
    expect(plan.updates).toHaveLength(2)
    expect(plan.updates.find((u) => u.slug === H1.slug)?.content).toContain("14%")
    expect(plan.unanchored).toHaveLength(0)
    expect(plan.orphans).toHaveLength(0)
    expect(plan.missing).toHaveLength(0)
  })

  it("a section with no anchor imports as a new unanchored note", () => {
    const plan = planReimport("## p.2 · A new thought\n\nNo anchor here, just prose.\n", [H1.slug])
    expect(plan.unanchored).toEqual([{ heading: "p.2 · A new thought", content: "No anchor here, just prose." }])
    expect(plan.missing).toEqual([H1.slug]) // H1 vanished from the file: reported, never silently deleted
  })

  it("an unknown slug is reported as an orphan, never guessed or dropped", () => {
    const md = "## p.9 · Mystery\n<!-- tb id=h-p99-99-zzzzzz page=9 rect= layer=group extraction=ocr -->\n\n> ?\n"
    const plan = planReimport(md, [H1.slug])
    expect(plan.orphans).toEqual(["h-p99-99-zzzzzz"])
    expect(plan.updates).toHaveLength(0)
  })

  it("thinkboard.json is lossless and versioned", () => {
    const manifest = buildManifest(INPUT)
    expect(manifest.schema_version).toBe(1)
    expect(manifest.highlights).toEqual([H1, H2])
    expect(manifest.notes[0].content).toContain("selisihnya")
  })
})

describe("document.pdf annotations (g4)", () => {
  it("appends a /Highlight per rect with /NM = slug, leaving the original bytes a valid PDF", async () => {
    const base = await basePdf()
    const out = await appendHighlightsToPdf(base, [H1])

    // pdf-lib rewrites the object graph (it never calls page.render, so no page is re-rendered); the original
    // bytes on disk stay untouched, which is the point — appending is not rasterizing.

    const stillBase = await PDFDocument.load(base)
    expect(stillBase.getPage(0).node.Annots()).toBeUndefined()

    const reread = await PDFDocument.load(out)
    expect(reread.getPageCount()).toBe(3)
    const annots = reread.getPage(2).node.Annots() // H1 is on page 3
    expect(annots?.size()).toBe(1)
    const dict = reread.context.lookup(annots!.get(0)) as PDFDict
    expect(dict.get(PDFName.of("Subtype"))?.toString()).toBe("/Highlight")
    expect((dict.get(PDFName.of("NM")) as PDFHexString).decodeText()).toBe(H1.slug)

    // normalized top-left rect (0.1,0.2,0.3,0.05) of a 600x800 page -> PDF bottom-left
    const quad = dict.get(PDFName.of("QuadPoints")) as PDFArray
    expect(quad.size()).toBe(8)
    expect(Number(quad.get(0).toString())).toBeCloseTo(60) // x
    expect(Number(quad.get(1).toString())).toBeCloseTo(640) // upper-left y = 800 * (1 - 0.2)
    expect(Number(quad.get(5).toString())).toBeCloseTo(600) // lower y = 800 * (1 - 0.25)
  })

  it("skips a highlight whose page is outside the document", async () => {
    const out = await appendHighlightsToPdf(await basePdf(), [{ ...H1, page: 9 }])
    const reread = await PDFDocument.load(out)
    expect(reread.getPage(0).node.Annots()).toBeUndefined()
  })
})

describe("the zip (g4)", () => {
  it("holds document.pdf, notes.md and thinkboard.json and reads back", async () => {
    const base = await basePdf()
    const zip = await buildBundleZip(INPUT, base)
    const { notesMarkdown, manifest, pdfBytes } = readBundleZip(zip)
    expect(manifest.session_id).toBe("s1")
    expect(manifest.schema_version).toBe(1)
    expect(notesMarkdown).toContain("h-p03-01-aaaaaa")
    expect(pdfBytes.length).toBe(base.length)
  })

  it("names the file workspace-{slug}-{yyyymmdd}.zip", () => {
    expect(bundleFilename("my-workspace", new Date(2026, 8, 25))).toBe("workspace-my-workspace-20260925.zip")
  })
})
