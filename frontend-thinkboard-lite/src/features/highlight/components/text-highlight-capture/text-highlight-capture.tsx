"use client"

import { useTextHighlightCapture } from "./use-text-highlight-capture"
import type { TextHighlightCaptureProps } from "./types"

/** No DOM of its own: it only listens over the z1 element it is handed and writes on selection end. */
export function TextHighlightCapture(props: TextHighlightCaptureProps) {
  useTextHighlightCapture(props)
  return null
}
