"use client"

import Konva from "konva"
import type { Point } from "@shared/utils/geometry"
import type { MarqueeStyle, MarqueeTool } from "./types"

/**
 * THE EXCEPTION (I17): the only file in this leaf allowed `new Konva.*`, node mutation or `batchDraw()`.
 * Takes a layer ref plus plain pixel data and returns a disposer — no store hook, no Dexie, no feature
 * import (I18). Coordinates here are pixels; the hook normalizes to page-relative 0–1 before anything
 * crosses out (I19). `batchDraw()` is Konva's own rAF-coalesced redraw, so a per-move call is one frame.
 */
export type MarqueePainter = {
  /** Append a moving point (rect tool keeps just its first and latest corner). */
  push(point: Point): void
  /** The pixel points captured so far. */
  commit(): Point[]
  /** Drop the live node's geometry without disposing it. */
  clear(): void
  /** Remove the live node entirely. */
  dispose(): void
}

// Tokens.test forbids hex under shared/components: fall back to the same oklch token shape the theme uses
// (Konva cannot read a CSS variable, so a resolved string is always handed in by the caller anyway).
const DEFAULT_STYLE: MarqueeStyle = { color: "oklch(0.9 0.17 95 / 45%)", width: 2, dash: [6, 4] }

/** The `04 §5.2` painter contract: a layer ref plus plain data, nothing else. */
export function createStrokePainter(layer: Konva.Layer, tool: MarqueeTool, style: Partial<MarqueeStyle> = {}): MarqueePainter {
  const s: MarqueeStyle = { ...DEFAULT_STYLE, ...style }
  const points: Point[] = []
  const node =
    tool === "rect"
      ? new Konva.Rect({ x: 0, y: 0, width: 0, height: 0, stroke: s.color, strokeWidth: s.width, dash: s.dash, listening: false })
      : new Konva.Line({ points: [], stroke: s.color, strokeWidth: s.width, lineCap: "round", lineJoin: "round", dash: s.dash, listening: false })
  layer.add(node)
  layer.batchDraw()

  const drawRect = (from: Point, to: Point) => {
    const rect = node as Konva.Rect
    rect.x(Math.min(from.x, to.x))
    rect.y(Math.min(from.y, to.y))
    rect.width(Math.abs(to.x - from.x))
    rect.height(Math.abs(to.y - from.y))
  }

  return {
    push(point) {
      if (tool === "rect") {
        if (points.length === 0) points.push(point)
        else points[1] = point // the rect tool keeps only its first and latest corner
        drawRect(points[0], point)
      } else {
        points.push(point)
        ;(node as Konva.Line).points(points.flatMap((p) => [p.x, p.y]))
      }
      layer.batchDraw()
    },
    commit() {
      return points.map((p) => ({ ...p }))
    },
    clear() {
      points.length = 0
      if (tool === "rect") drawRect({ x: 0, y: 0 }, { x: 0, y: 0 })
      else (node as Konva.Line).points([])
      layer.batchDraw()
    },
    dispose() {
      points.length = 0
      node.destroy()
      layer.batchDraw()
    },
  }
}

/** Paint a stored/fixture polyline (Storybook's `ManyStrokes`); returns its own disposer. */
export function paintStroke(layer: Konva.Layer, points: Point[], style: Partial<MarqueeStyle> = {}): () => void {
  const s: MarqueeStyle = { ...DEFAULT_STYLE, ...style }
  const node = new Konva.Line({ points: points.flatMap((p) => [p.x, p.y]), stroke: s.color, strokeWidth: s.width, lineCap: "round", lineJoin: "round", listening: false })
  layer.add(node)
  layer.batchDraw()
  return () => {
    node.destroy()
    layer.batchDraw()
  }
}
