"use client"

import { useCallback, useMemo, useState } from "react"
import { useHighlightsForSession } from "@feature/entities/queries/use-highlights-for-session"
import { insertHighlights, type NewHighlight } from "@feature/entities/repository/highlight-repository"
import type { ArtifactRow } from "@feature/entities/types"
import { highlightSlug } from "@shared/lib/slug"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import type { Json } from "@shared/types/domain/common"
import type { Rect } from "@shared/utils/geometry"
import { isBbox, type Bbox } from "../../types/bbox"
import { needsCorrection } from "../../utils/confidence-gate"
import { readingOrderRank } from "../../utils/reading-order"
import type { ImportReviewItem, ImportReviewProps } from "./types"

/**
 * g4/g5 + 032: the ladder's candidates become review rows, none selected; `accept` writes the selected ones as
 * group highlights (RULE-04) in ONE transaction (F5), each on its OWN page. The 0.70 gate is surfaced per row.
 * The slug order ranks per page, against that page's existing marks then the ones chosen earlier.
 */
export function useImportReview({ artifactId, profileId, candidates, onCommitted }: ImportReviewProps) {
  const { sessionId } = useWorkspaceContext()
  const existing = useHighlightsForSession((sessionId ?? "") as ArtifactRow["sessionId"])
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
      setOverrides((current) =>
        Object.fromEntries(
          candidates.map((_, index) => {
            const id = `candidate-${index}`
            return [id, { ...current[id], selected }]
          })
        )
      ),
    [candidates]
  )

  const selectedCount = useMemo(() => items.filter((item) => item.selected).length, [items])

  const accept = useCallback(async (): Promise<number> => {
    const chosen = items.filter((item) => item.selected)
    if (chosen.length === 0) return 0

    // Rank per page: that page's existing marks first, then the ones chosen earlier in this same import.
    const rankedByPage = new Map<number, Rect[]>()
    for (const row of existing ?? []) {
      if (!isBbox(row.bbox)) continue
      const list = rankedByPage.get(row.bbox.page) ?? []
      list.push(row.bbox.rects[0])
      rankedByPage.set(row.bbox.page, list)
    }

    const inputs: NewHighlight[] = []
    for (const item of chosen) {
      const primary = item.rects[0]
      const ranked = rankedByPage.get(item.page) ?? []
      const order = readingOrderRank(primary, ranked)
      ranked.push(primary)
      rankedByPage.set(item.page, ranked)
      const slug = await highlightSlug(item.text || "import", primary, item.page, order)
      const bbox: Bbox = { page: item.page, rects: item.rects, color: null, tool: "rect" }
      inputs.push({ artifactId, profileId, text: item.text, page: item.page, bbox: bbox as unknown as Json, confidence: item.confidence, extraction: item.extraction, slug, layer: "group" })
    }

    await insertHighlights(inputs)
    setOverrides({})
    onCommitted?.(inputs.length)
    return inputs.length
  }, [items, existing, artifactId, profileId, onCommitted])

  return { items, toggle, edit, toggleAll, selectedCount, accept }
}
