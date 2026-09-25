import type Konva from "konva"
import type { Point, Rect, Rotation } from "@shared/utils/geometry"

/** The two region tools (blueprint canvasLeaves[`marquee`]); both live in this one leaf (analyze.json NEW-1). */
export type MarqueeTool = "rect" | "freehand"

/**
 * The committed, page-relative normalized geometry one stroke produced (RULE-17 / I19: never viewport
 * pixels — this is what makes a region survive zoom and rotation).
 */
export type MarqueeStroke = {
  tool: MarqueeTool
  /** One normalized bounding rect: the marquee itself, or the box enclosing a freehand lasso. */
  rects: Rect[]
  /** The normalized points as captured, so a future importer can rebuild a lasso. */
  points: Point[]
}

export type MarqueeStyle = { color: string; width: number; dash: number[] }

export type MarqueeProps = {
  /** `null` disarms the leaf: it captures nothing and paints nothing, so the page scrolls/pans as usual (g2). */
  tool: MarqueeTool | null
  /** The displayed (rotated + zoomed) page box in CSS pixels — the Stage's own width/height. */
  size: { w: number; h: number }
  rotation: Rotation
  /** Live-stroke colour; a design-system token resolved by the caller (Konva does not inherit CSS variables). */
  color?: string
  /** Storybook fixture strokes (`ManyStrokes`); painted through the painter, never committed (04 §10). */
  fixtures?: Point[][]
  /** Fires once on pointerup with the normalized geometry. */
  onCommit?: (stroke: MarqueeStroke) => void
}

export type MarqueePointerEvent = Konva.KonvaEventObject<PointerEvent>
