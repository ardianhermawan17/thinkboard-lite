import type { PDFDocumentProxy } from "pdfjs-dist"
import { getOrFetch, requestPersistence, type ArtifactBytes } from "@shared/lib/opfs"
import { getSupabase } from "@shared/lib/supabase"

const BUCKET = "artifacts"

// The one place pdfjs-dist is configured (03 6.2). It is imported lazily: the library touches window and workers,
// so nothing may run at import time (SSR) and every caller is client-only (I24).
export type PdfDocument = PDFDocumentProxy

let pdfjs: Promise<typeof import("pdfjs-dist")> | null = null

function loadPdfjs() {
  pdfjs ??= import("pdfjs-dist").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
    return lib
  })
  return pdfjs
}

/**
 * One download from private Storage under the caller's own RLS session (RULE-01). `storagePath` is the full
 * `artifacts/{sessionId}/{artifactId}.pdf` string from the row, bucket first (0005), so the bucket prefix is stripped.
 */
export async function downloadArtifact(storagePath: string): Promise<Uint8Array> {
  const objectName = storagePath.startsWith(`${BUCKET}/`) ? storagePath.slice(BUCKET.length + 1) : storagePath
  const { data, error } = await getSupabase().storage.from(BUCKET).download(objectName)
  if (error || !data) throw new Error(`Could not download ${storagePath}: ${error?.message ?? "no data"}`)
  return new Uint8Array(await data.arrayBuffer())
}

/** Bytes for one artifact: OPFS on a second open, Storage on the first (or after eviction), then persistence is requested. */
export async function loadArtifactBytes(profileId: string, storagePath: string): Promise<ArtifactBytes> {
  const out = await getOrFetch(profileId, storagePath, () => downloadArtifact(storagePath))
  void requestPersistence()
  return out
}

/** Opens PDF bytes.
 * The bytes are copied: pdfjs transfers its input to the worker, which would empty the OPFS-read buffer. */
export async function openPdf(bytes: Uint8Array): Promise<PdfDocument> {
  const lib = await loadPdfjs()
  return lib.getDocument({ data: bytes.slice() }).promise
}

/** z0: paints one page into `canvas` at natural resolution times `scale` (zoom, and devicePixelRatio for sharpness). */
export async function renderPage(doc: PdfDocument, pageNumber: number, canvas: HTMLCanvasElement, scale: number) {
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 2D context unavailable")
  const task = page.render({ canvasContext: context, viewport, canvas })
  await task.promise
  return { width: viewport.width, height: viewport.height }
}

/** z1: PDF.js's own text layer — real, selectable spans, positioned by pdfjs itself (03 §6.1: highlights come from here, never z2). */
export async function renderTextLayer(doc: PdfDocument, pageNumber: number, container: HTMLDivElement, scale: number) {
  const lib = await loadPdfjs()
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  container.style.width = `${viewport.width}px`
  container.style.height = `${viewport.height}px`
  const layer = new lib.TextLayer({ textContentSource: page.streamTextContent(), container, viewport })
  await layer.render()
  return layer
}
