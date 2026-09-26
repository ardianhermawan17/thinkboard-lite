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

/** z0: paints one page into `canvas` at natural resolution times `scale` (zoom, and devicePixelRatio for sharpness).
 * `signal` cancels an in-flight render: pdfjs refuses two renders on one canvas ("Cannot use the same canvas
 * during multiple render() operations"), so a page/zoom change — or React's dev double-effect — must cancel the
 * previous paint instead of colliding with it. A cancelled render rejects; the caller ignores it when aborted. */
export async function renderPage(doc: PdfDocument, pageNumber: number, canvas: HTMLCanvasElement, scale: number, signal?: AbortSignal) {
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas 2D context unavailable")
  if (signal?.aborted) throw new DOMException("render aborted", "AbortError")
  const task = page.render({ canvasContext: context, viewport, canvas })
  const cancel = () => task.cancel()
  signal?.addEventListener("abort", cancel, { once: true })
  try {
    await task.promise
  } finally {
    signal?.removeEventListener("abort", cancel)
  }
  return { width: viewport.width, height: viewport.height }
}

/** z1: PDF.js's own text layer — real, selectable spans, positioned by pdfjs itself (03 §6.1: highlights come from here, never z2).
 * Cancels with the same `signal` as z0, so a replaced page never leaves a half-built text layer behind. */
export async function renderTextLayer(doc: PdfDocument, pageNumber: number, container: HTMLDivElement, scale: number, signal?: AbortSignal) {
  const lib = await loadPdfjs()
  const page = await doc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  container.style.width = `${viewport.width}px`
  container.style.height = `${viewport.height}px`
  const layer = new lib.TextLayer({ textContentSource: page.streamTextContent(), container, viewport })
  if (signal?.aborted) {
    layer.cancel()
    return layer
  }
  const cancel = () => layer.cancel()
  signal?.addEventListener("abort", cancel, { once: true })
  try {
    await layer.render()
  } finally {
    signal?.removeEventListener("abort", cancel)
  }
  return layer
}

/**
 * Rasterizes one page off-screen and returns its RGBA pixels — the ink source rungs 2/3 read (spec §5.4). It
 * returns null where no 2D context exists (SSR, jsdom), so a caller can simply skip the ink rungs.
 */
export async function pageImageData(doc: PdfDocument, pageNumber: number, scale = 1): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  await renderPage(doc, pageNumber, canvas, scale)
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  return { data: image.data, width: image.width, height: image.height }
}
