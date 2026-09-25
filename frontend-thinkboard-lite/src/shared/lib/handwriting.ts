/**
 * Capability detector (v2 §4): `{ pen, osStylusText, localRecognizer }`, not a recognizer itself.
 * `osStylusText` cannot be feature-detected — the OS converts pen strokes to text inside any real
 * `<textarea>` invisibly to the page (05 §3.1) — so it is inferred true the moment a pen is seen.
 */
export type HandwritingSupport = {
  pen: boolean
  osStylusText: boolean
  localRecognizer: boolean
}

export function detectHandwritingSupport(): HandwritingSupport {
  const localRecognizer = typeof navigator !== "undefined" && "createHandwritingRecognizer" in navigator
  return { pen: false, osStylusText: false, localRecognizer }
}

/** Fires once, the first time a `pointerType: "pen"` event reaches `window`. Returns an unsubscribe. */
export function watchForPen(onPenDetected: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = (event: PointerEvent) => {
    if (event.pointerType !== "pen") return
    window.removeEventListener("pointerdown", handler)
    onPenDetected()
  }
  window.addEventListener("pointerdown", handler)
  return () => window.removeEventListener("pointerdown", handler)
}
