import { useCallback } from "react"
import type { MarqueeStroke } from "@shared/components/canvas/marquee"
import { recognizeRegion } from "@shared/lib/ocr"
import { highlightSlug } from "@shared/lib/slug"
import type { Json, UUID } from "@shared/types/domain/common"
import { denormalizeRect } from "@shared/utils/geometry"
import { insertHighlight } from "@feature/entities/repository/highlight-repository"
import { useHighlightsForPage } from "@feature/entities/queries/use-highlights-for-page"
import { isBbox, type Bbox } from "../../types/bbox"
import { readingOrderRank } from "../../utils/reading-order"
import type { RegionHighlightCaptureProps } from "./types"

/**
 * Orchestrates g3 and g4: on a committed region, crop the page canvas to the region and run the lazy,
 * cropped OCR, then write one `extraction='ocr'` highlight through the existing repository. The confidence
 * is stored raw — the 0.70 gate is derived (`utils/confidence-gate.ts`), so a below-gate mark is
 * `needs-correction` and excluded from any Result until a human accepts it, but the mark itself still saves.
 *
 * A container leaf: the only file in this component that touches Dexie (via repository/query hooks). The
 * OCR call is never awaited on a *note* save path (I28); it decorates a repository write that already landed.
 */
export function useRegionHighlightCapture({ artifactId, profileId, page, size, rotation, canvas }: RegionHighlightCaptureProps) {
  const existing = useHighlightsForPage(artifactId, page)

  const onCommit = useCallback(
    async (stroke: MarqueeStroke) => {
      if (!canvas || size.w === 0 || size.h === 0 || stroke.rects.length === 0) return
      const primary = stroke.rects[0]

      // The crop is the queued region's box denormalized to the displayed pixels Tesseract will read.
      const crop = denormalizeRect(primary, size, rotation)
      const { text, confidence } = await recognizeRegion(canvas, crop)

      const existingRects = (existing ?? []).map((h) => (isBbox(h.bbox) ? h.bbox.rects[0] : undefined)).filter((r): r is NonNullable<typeof r> => Boolean(r))
      const order = readingOrderRank(primary, existingRects)
      const slug = await highlightSlug(text || "region", primary, page, order)

      // color stays null: highlight-layer resolves the design token at render (010's rule).
      const bbox: Bbox = { page, rects: stroke.rects, color: null, tool: stroke.tool }
      await insertHighlight({
        artifactId,
        profileId: profileId as UUID<"profiles">,
        text,
        page,
        bbox: bbox as unknown as Json,
        confidence,
        extraction: "ocr",
        slug,
      })
    },
    [artifactId, profileId, page, size, rotation, canvas, existing]
  )

  return { onCommit }
}
