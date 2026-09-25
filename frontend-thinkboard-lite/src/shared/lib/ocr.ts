// RULE-19: OCR is the last rung of the detection ladder and runs on crops only, never whole pages.
// Tesseract loads lazily, inside its own Worker, and the seam is fail-soft: a missing worker, no network or
// no traineddata returns a below-gate result so the region still saves a mark offline (I28: nothing on the
// note-save path awaits a model; a region mark is a repository write, and OCR is decoration on top of it).
import type { Rect } from "@shared/utils/geometry"

/** `confidence` is normalized 0-1, never Tesseract's own 0-100. */
export type OcrResult = { text: string; confidence: number }

export type OcrOptions = {
  /** Tesseract language string, e.g. `"ind+eng"`. Defaults to Indonesian + English (the pilot's documents). */
  languages?: string
}

export const DEFAULT_OCR_LANGUAGES = "ind+eng"

// Structural type for the one slice of tesseract.js this seam uses, so the module stays lazy and cheap to mock.
type OcrWorker = {
  recognize(image: HTMLCanvasElement): Promise<{ data: { text: string; confidence: number } }>
  terminate(): Promise<unknown>
}

let workerPromise: Promise<OcrWorker> | null = null

async function getWorker(languages: string): Promise<OcrWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js")
      return (await createWorker(languages)) as unknown as OcrWorker
    })().catch((error: unknown) => {
      // A failed create must not poison the cache: the next commit retries with a fresh worker.
      workerPromise = null
      throw error
    })
  }
  return workerPromise
}

/** Crop the region out of a page-sized source into its own canvas so Tesseract sees the crop and nothing else. */
export function cropRegion(source: CanvasImageSource, crop: Rect): HTMLCanvasElement {
  const width = Math.max(1, Math.round(crop.w))
  const height = Math.max(1, Math.round(crop.h))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (ctx) ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height)
  return canvas
}

/**
 * Recognize the cropped region and return `{text, confidence}` (0-1). Never throws: a region captured offline
 * still produces a saved mark, just below the confidence gate.
 */
export async function recognizeRegion(source: CanvasImageSource, crop: Rect, options: OcrOptions = {}): Promise<OcrResult> {
  try {
    const worker = await getWorker(options.languages ?? DEFAULT_OCR_LANGUAGES)
    const { data } = await worker.recognize(cropRegion(source, crop))
    return { text: data.text.trim(), confidence: clamp01(data.confidence / 100) }
  } catch {
    return { text: "", confidence: 0 }
  }
}

/** Release the shared worker (tests, and sign-out's local-data wipe). */
export async function terminateOcr(): Promise<void> {
  const pending = workerPromise
  workerPromise = null
  if (!pending) return
  try {
    await (await pending).terminate()
  } catch {
    // already gone, or never started
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}
