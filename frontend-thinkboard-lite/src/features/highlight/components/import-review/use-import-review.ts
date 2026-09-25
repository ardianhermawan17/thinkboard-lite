"use client"

import { useCallback, useMemo, useState } from "react"
import { useHighlightsForPage } from "@feature/entities/queries/use-highlights-for-page"
import { insertHighlights, type NewHighlight } from "@feature/entities/repository/highlight-repository"
import { highlightSlug } from "@shared/lib/slug"
import type { Json } from "@shared/types/domain/common"
import { isBbox, type Bbox } from "../../types/bbox"
import { needsCorrection } from "../../utils/confidence-gate"
import { readingOrderRank } from "../../utils/reading-order"
import type { ImportReviewItem, ImportReviewProps } from "./types"

/**
 * g4/g5: the ladder's candidates are DERIVED into review rows (none selected; a below-gate row is flagged), and
 * only the reviewer's overrides live in state — no seed effect. `accept` writes the selected rows as group
 * highlights (RULE-04: the import is the leader's act) in ONE transaction (F5). The 0.70 gate is surfaced but
 * does not block the import; a Result filters it later.
 */
export function useImportReview({ artifactId, profileId, page, candidates, onCommitted }: ImportReviewProps) {
  const existing = useHighlightsForPage(artifactId, page)
  const [overrides, setOverrides] = useState<Record<string, { selected?: boolean; text?: string }>>({})

  const items = useMemo<ImportReviewItem[]>(
    () =>
      candidates.map((candidate, index) => {
        const id = `candidate-${index}`
        return {
          ...candidate,
          id,
          text: overrides[id]?.text ?? candidate.text,
          selected: overrides[id]?.selected ?? false,
          needsCorrection: needsCorrection({ extraction: candidate.extraction, confidence: candidate.confidence }),
        }
      }),
    [candidates, overrides]
  )

  const toggle = useCallback((id: string, selected: boolean) => setOverrides((current) => ({ ...current, [id]: { ...current[id], selected } })), [])
  const edit = useCallback((id: string, text: string) => setOverrides((current) => ({ ...current, [id]: { ...current[id], text } })), [])
  const toggleAll = useCallback(
    (selected: boolean) =>
      setOverrides((current) => Object.fromEntries(candidates.map((_, index) => {
        const id = `candidate-${index}`
        return [id, { ...current[id], selected }]
      }))),
    [candidates]
  )

  const selectedCount = useMemo(() => items.filter((item) => item.selected).length, [items])

  const accept = useCallback(async (): Promise<number> => {
    const chosen = items.filter((item) => item.selected)
    if (chosen.length === 0) return 0

    // Rank against the page's existing marks plus the ones chosen earlier in this same import.
    const ranked = (existing ?? []).map((row) => (isBbox(row.bbox) ? row.bbox.rects[0] : undefined)).filter((rect): rect is NonNullable<typeof rect> => Boolean(rect))
    const inputs: NewHighlight[] = []
    for (const item of chosen) {
      const primary = item.rects[0]
      const order = readingOrderRank(primary, ranked)
      ranked.push(primary)
      const slug = await highlightSlug(item.text || "import", primary, page, order)
      const bbox: Bbox = { page, rects: item.rects, color: null, tool: "rect" }
      inputs.push({ artifactId, profileId, text: item.text, page, bbox: bbox as unknown as Json, confidence: item.confidence, extraction: item.extraction, slug, layer: "group" })
    }

    await insertHighlights(inputs)
    setOverrides({})
    onCommitted?.(inputs.length)
    return inputs.length
  }, [items, existing, artifactId, profileId, page, onCommitted])

  return { items, toggle, edit, toggleAll, selectedCount, accept }
}
