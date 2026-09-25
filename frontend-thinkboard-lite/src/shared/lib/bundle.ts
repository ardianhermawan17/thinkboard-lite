// Export and traceability (spec §5.6, RULE-25). One zip, three files, one id: every highlight's slug is the
// same string in the DB row, the notes.md `<!-- tb id=... -->` anchor and the PDF annotation's /NM entry.
// Pure and dependency-light: fflate for the zip, pdf-lib (lazy) to APPEND annotations to the original bytes —
// a page is never re-rendered, or the text layer everything depends on is destroyed.
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate"
import type { Rect } from "@shared/utils/geometry"

export const BUNDLE_SCHEMA_VERSION = 1

/** The one identity anchor (RULE-25): only this HTML comment identifies a section on re-import. */
export const ANCHOR_PATTERN = /<!--\s*tb\s+([^>]*?)-->/

export type BundleNoteInputMode = "keyboard" | "stylus_os" | "ink"
export type BundleLayer = "individual" | "group"
export type BundleExtraction = "text_layer" | "ocr"

export type BundleHighlight = {
  id: string
  slug: string
  page: number
  rects: Rect[]
  text: string
  layer: BundleLayer
  extraction: BundleExtraction
  confidence: number | null
  weight: number
}

export type BundleNote = {
  id: string
  highlightId: string
  content: string
  inputMode: BundleNoteInputMode
  visibility: BundleLayer
}

export type BundleInput = {
  sessionId: string
  artifactId: string
  title: string | null
  goal: string | null
  pageCount: number | null
  highlights: BundleHighlight[]
  notes: BundleNote[]
}

export type BundleManifest = {
  schema_version: number
  session_id: string
  artifact_id: string
  title: string | null
  goal: string | null
  page_count: number | null
  highlights: BundleHighlight[]
  notes: BundleNote[]
}

export type ParsedSection = { slug: string | null; heading: string; highlightText: string; note: string }

export type ReimportPlan = {
  /** Matched by slug: update the existing note; never a duplicate. */
  updates: { slug: string; content: string }[]
  /** No anchor: a genuinely new, unanchored note (RULE-25). */
  unanchored: { heading: string; content: string }[]
  /** A slug the file names but this workspace does not know: reported, never guessed. */
  orphans: string[]
  /** A known slug the file no longer mentions: reported, never silently deleted. */
  missing: string[]
}

export function buildManifest(input: BundleInput): BundleManifest {
  return {
    schema_version: BUNDLE_SCHEMA_VERSION,
    session_id: input.sessionId,
    artifact_id: input.artifactId,
    title: input.title,
    goal: input.goal,
    page_count: input.pageCount,
    highlights: input.highlights,
    notes: input.notes,
  }
}

const firstLine = (text: string) => text.split("\n")[0].trim()

function anchorFor(highlight: BundleHighlight): string {
  const [rect] = highlight.rects
  const rectField = rect ? [rect.x, rect.y, rect.w, rect.h].join(",") : ""
  return `<!-- tb id=${highlight.slug} page=${highlight.page} rect=${rectField} layer=${highlight.layer} extraction=${highlight.extraction} -->`
}

/** One section per focus point, in reading order, each carrying exactly one identity anchor. */
export function renderNotesMarkdown(input: BundleInput): string {
  const ordered = [...input.highlights].sort((a, b) => (a.page - b.page) || a.slug.localeCompare(b.slug))
  const blocks = ordered.map((h) => {
    const heading = firstLine(h.text) || h.slug
    const quote = h.text ? `> ${h.text.replace(/\n/g, "\n> ")}` : ""
    const notes = input.notes
      .filter((n) => n.highlightId === h.id)
      .map((n) => n.content.trim())
      .filter(Boolean)
      .join("\n\n")
    return [`## p.${h.page} · ${heading}`, anchorFor(h), quote, notes].filter((part) => part !== "").join("\n\n")
  })
  return `${blocks.join("\n\n")}\n`
}

function parseAnchor(anchor: string): string | null {
  const match = /(?:^|\s)id=(\S+)/.exec(anchor)
  return match ? match[1] : null
}

/** Parse notes.md back into sections. Only the `<!-- tb … -->` comment yields a slug (RULE-25). */
export function parseNotesMarkdown(markdown: string): ParsedSection[] {
  return markdown
    .split(/\n(?=## )/)
    .filter((section) => section.trimStart().startsWith("## "))
    .map((section) => {
      const heading = section.split("\n")[0].replace(/^##\s*/, "").trim()
      const match = ANCHOR_PATTERN.exec(section)
      const slug = match ? parseAnchor(match[1]) : null
      const rest = match ? section.slice(section.indexOf(match[0]) + match[0].length) : section.slice(section.indexOf("\n"))
      const lines = rest.split("\n").map((l) => l.replace(/\s+$/, ""))
      let i = 0
      const quote: string[] = []
      while (i < lines.length && (lines[i].trim() === "" || lines[i].startsWith(">"))) {
        if (lines[i].startsWith(">")) quote.push(lines[i].replace(/^>\s?/, ""))
        i++
      }
      return { slug, heading, highlightText: quote.join("\n").trim(), note: lines.slice(i).join("\n").trim() }
    })
}

/** The re-import plan: updates by slug, new unanchored notes, and both orphan directions reported (RULE-25). */
export function planReimport(markdown: string, existingSlugs: string[]): ReimportPlan {
  const known = new Set(existingSlugs)
  const seen = new Set<string>()
  const updates: ReimportPlan["updates"] = []
  const unanchored: ReimportPlan["unanchored"] = []
  const orphans: string[] = []
  for (const section of parseNotesMarkdown(markdown)) {
    if (!section.slug) {
      unanchored.push({ heading: section.heading, content: section.note })
      continue
    }
    seen.add(section.slug)
    if (known.has(section.slug)) updates.push({ slug: section.slug, content: section.note })
    else orphans.push(section.slug)
  }
  return { updates, unanchored, orphans, missing: existingSlugs.filter((slug) => !seen.has(slug)) }
}

/**
 * g4: append a /Highlight annotation per rect to the ORIGINAL bytes (`/NM` = slug). Page-relative normalized
 * rects use a top-left origin; PDF rects are bottom-left, Y-up, so Y is flipped here — the one conversion
 * that mirrors every mark if skipped.
 */
export async function appendHighlightsToPdf(pdfBytes: Uint8Array, highlights: BundleHighlight[]): Promise<Uint8Array> {
  const { PDFDocument, PDFHexString, PDFName } = await import("pdf-lib")
  const doc = await PDFDocument.load(pdfBytes)
  const pages = doc.getPages()
  for (const highlight of highlights) {
    const page = pages[highlight.page - 1]
    if (!page) continue
    const width = page.getWidth()
    const height = page.getHeight()
    for (const r of highlight.rects) {
      const x = r.x * width
      const y = height - (r.y + r.h) * height
      const w = r.w * width
      const h = r.h * height
      const quad = [x, y + h, x + w, y + h, x, y, x + w, y] // UL, UR, LL, LR
      const annot = doc.context.obj({
        Type: PDFName.of("Annot"),
        Subtype: PDFName.of("Highlight"),
        Rect: [x, y, x + w, y + h],
        QuadPoints: quad,
        C: [1, 0.85, 0.2],
        T: PDFHexString.fromText("ThinkBoard"),
        Contents: PDFHexString.fromText(highlight.text),
        F: 4,
      })
      if (highlight.slug) annot.set(PDFName.of("NM"), PDFHexString.fromText(highlight.slug))
      page.node.addAnnot(doc.context.register(annot))
    }
  }
  return doc.save()
}

/** The three files, one zip (spec §5.6). pdfBytes are the original bytes with annotations appended. */
export async function buildBundleZip(input: BundleInput, pdfBytes: Uint8Array): Promise<Uint8Array> {
  const notesMarkdown = renderNotesMarkdown(input)
  const manifest = buildManifest(input)
  return zipSync(
    {
      "document.pdf": pdfBytes,
      "notes.md": strToU8(notesMarkdown),
      "thinkboard.json": strToU8(JSON.stringify(manifest, null, 2)),
    },
    { level: 6 }
  )
}

export function readBundleZip(zipBytes: Uint8Array): { notesMarkdown: string; manifest: BundleManifest; pdfBytes: Uint8Array } {
  const files = unzipSync(zipBytes)
  const pdfBytes = files["document.pdf"]
  const notes = files["notes.md"]
  const manifest = files["thinkboard.json"]
  if (!pdfBytes || !notes || !manifest) throw new Error("bundle is missing one of document.pdf, notes.md, thinkboard.json")
  return { notesMarkdown: strFromU8(notes), manifest: JSON.parse(strFromU8(manifest)) as BundleManifest, pdfBytes }
}

/** `workspace-{slug}-{yyyymmdd}.zip` (spec §5.6). */
export function bundleFilename(slug: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `workspace-${slug}-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.zip`
}
