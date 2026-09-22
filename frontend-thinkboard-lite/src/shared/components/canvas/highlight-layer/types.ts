import type { Rect, Rotation, Size } from "@shared/utils/geometry"

/** Plain data a container hands down: `rects` and `color` only, never a Dexie row (I18). */
export type StoredHighlight = {
  id: string
  rects: Rect[]
  color: string
}

export type HighlightLayerProps = {
  highlights: StoredHighlight[]
  /** The page's current displayed size — the same value page-stage already tracks as `pageSize`. */
  size: Size
  rotation: Rotation
}
