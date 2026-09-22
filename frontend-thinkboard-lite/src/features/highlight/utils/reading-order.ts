import type { Rect } from "@shared/utils/geometry"

/**
 * The slug's `order` component (analyze.json NEW-1): the 1-based reading-order rank of `rect` among
 * `existing` rects already on the page, sorted top-to-bottom then left-to-right. Deterministic from
 * geometry alone, unlike an insertion counter, so re-importing the same document dedupes (spec 5.6).
 */
export function readingOrderRank(rect: Rect, existing: Rect[]): number {
  const before = existing.filter((r) => r.y < rect.y || (r.y === rect.y && r.x < rect.x)).length
  return before + 1
}
