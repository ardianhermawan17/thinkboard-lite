import { useCallback, useEffect } from "react"
import { insertHighlight } from "@feature/entities/repository/highlight-repository"
import { useHighlightsForPage } from "@feature/entities/queries/use-highlights-for-page"
import { highlightSlug } from "@shared/lib/slug"
import type { Json } from "@shared/types/domain/common"
import { readingOrderRank } from "../../utils/reading-order"
import { selectionText, selectionToRects } from "../../utils/selection-to-rects"
import { useNotesNudge } from "../../utils/use-notes-nudge"
import type { Bbox } from "../../types/bbox"
import type { TextHighlightCaptureProps } from "./types"

/**
 * Orchestrates g1 and g3: on selection end over z1, captures the exact text and normalized rects,
 * generates the deterministic slug, and writes the highlight through the existing repository call.
 * A container leaf: the only file in this feature that touches Dexie (via the repository/query hooks).
 */
export function useTextHighlightCapture({ artifactId, profileId, page, textLayerElement, textLayerSize, rotation, colorKey }: TextHighlightCaptureProps) {
  const existingHighlights = useHighlightsForPage(artifactId, page)
  const nudge = useNotesNudge()

  const capture = useCallback(async () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return
    // Only a selection made inside this page's text layer belongs to this page (z1 spans one page at a time).
    if (!textLayerElement.contains(selection.anchorNode)) return

    const text = selectionText(selection)
    if (!text) return

    const size = { w: textLayerSize.width, h: textLayerSize.height }
    const rects = selectionToRects(selection.getRangeAt(0), textLayerElement, size, rotation)
    if (rects.length === 0) return

    // The bbox's own rect (its top-left corner) decides reading order and feeds the slug hash (g2).
    const primary = rects[0]
    const order = readingOrderRank(primary, (existingHighlights ?? []).map((h) => (h.bbox as Bbox | null)?.rects[0]).filter((r): r is NonNullable<typeof r> => Boolean(r)))
    const slug = await highlightSlug(text, primary, page, order)
    // 043: the chosen hue travels on the row; the layer resolves it at render.
    const bbox: Bbox = { page, rects, color: colorKey ?? null, tool: "text_layer" }

    await insertHighlight({ artifactId, profileId, text, page, bbox: bbox as unknown as Json, confidence: 1.0, slug })
    selection.removeAllRanges()
    // In full-page reading the notes rail is away, so say where the mark just went.
    nudge(text)
  }, [artifactId, profileId, page, textLayerElement, textLayerSize, rotation, existingHighlights, colorKey, nudge])

  useEffect(() => {
    // Selection end, not every selectionchange tick: a drag fires selectionchange continuously.
    const onEnd = () => void capture()
    document.addEventListener("pointerup", onEnd)
    document.addEventListener("keyup", onEnd)
    return () => {
      document.removeEventListener("pointerup", onEnd)
      document.removeEventListener("keyup", onEnd)
    }
  }, [capture])
}
