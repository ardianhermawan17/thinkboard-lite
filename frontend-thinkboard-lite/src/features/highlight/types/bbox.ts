import type { Rect } from "@shared/utils/geometry"

// db §4.2: no x/y/w/h columns, no colour column -- one Json column carries all geometry, deliberately.
// Every rect here is page-relative and normalized 0-1 (RULE-17); a viewport pixel here is the bug that
// only shows up after someone zooms, weeks later, on another tablet.
export type Bbox = {
  page: number
  rects: Rect[]
  color: string | null
  tool: "text_layer"
}

function isRect(value: unknown): value is Rect {
  if (typeof value !== "object" || value === null) return false
  const r = value as Record<string, unknown>
  return ["x", "y", "w", "h"].every((k) => typeof r[k] === "number")
}

/** highlights.bbox is a loosely typed generated Json column -- this is the one place that trusts its shape. */
export function isBbox(value: unknown): value is Bbox {
  if (typeof value !== "object" || value === null) return false
  const b = value as Record<string, unknown>
  return typeof b.page === "number" && Array.isArray(b.rects) && b.rects.every(isRect) && (b.color === null || typeof b.color === "string") && b.tool === "text_layer"
}
