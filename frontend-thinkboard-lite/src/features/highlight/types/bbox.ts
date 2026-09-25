import type { Rect } from "@shared/utils/geometry"

// db §4.2: no x/y/w/h columns, no colour column -- one Json column carries all geometry, deliberately.
// Every rect here is page-relative and normalized 0-1 (RULE-17); a viewport pixel here is the bug that
// only shows up after someone zooms, weeks later, on another tablet.
// `text_layer` is 010's Selection/Range capture; `rect` and `freehand` are 011's Konva region capture
// (the marquee leaf's two tools). `extraction` distinguishes them on the row itself.
export type BboxTool = "text_layer" | "rect" | "freehand"

export type Bbox = {
  page: number
  rects: Rect[]
  color: string | null
  tool: BboxTool
}

const TOOLS: BboxTool[] = ["text_layer", "rect", "freehand"]

function isRect(value: unknown): value is Rect {
  if (typeof value !== "object" || value === null) return false
  const r = value as Record<string, unknown>
  return ["x", "y", "w", "h"].every((k) => typeof r[k] === "number")
}

function isTool(value: unknown): value is BboxTool {
  return typeof value === "string" && (TOOLS as string[]).includes(value)
}

/** highlights.bbox is a loosely typed generated Json column -- this is the one place that trusts its shape. */
export function isBbox(value: unknown): value is Bbox {
  if (typeof value !== "object" || value === null) return false
  const b = value as Record<string, unknown>
  return typeof b.page === "number" && Array.isArray(b.rects) && b.rects.every(isRect) && (b.color === null || typeof b.color === "string") && isTool(b.tool)
}
