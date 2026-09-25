"use client"

import { Marquee } from "@shared/components/canvas/marquee"
import { useRegionHighlightCapture } from "./use-region-highlight-capture"
import type { RegionHighlightCaptureProps } from "./types"

/**
 * Mounts the `marquee` canvas leaf into the page's z2 and writes each committed region as an OCR highlight.
 * A container leaf: it composes a shared canvas leaf (allowed) and owns the repository write.
 */
export function RegionHighlightCapture(props: RegionHighlightCaptureProps) {
  const { onCommit } = useRegionHighlightCapture(props)
  return <Marquee tool={props.tool} size={props.size} rotation={props.rotation} color={props.color} onCommit={onCommit} />
}
