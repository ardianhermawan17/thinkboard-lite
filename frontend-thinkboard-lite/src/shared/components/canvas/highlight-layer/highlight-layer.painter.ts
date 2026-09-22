"use client"

import Konva from "konva"

export type PaintedRect = { x: number; y: number; w: number; h: number; color: string }

/**
 * THE EXCEPTION (I17): the only file allowed `batchDraw()`, `new Konva.*` or `getLayer()`. Takes a
 * layer ref and plain data, returns a disposer — no store hook, no Dexie, no feature import (I18).
 */
export function paintHighlights(layer: Konva.Layer, rects: PaintedRect[]): () => void {
  const nodes = rects.map(
    (r) =>
      new Konva.Rect({
        x: r.x,
        y: r.y,
        width: r.w,
        height: r.h,
        fill: r.color,
        opacity: 0.35,
        listening: false, // text-layer clicks/selection must reach z1, never be swallowed by a mark
      })
  )
  nodes.forEach((n) => layer.add(n))
  layer.batchDraw()

  return () => {
    nodes.forEach((n) => n.destroy())
    layer.batchDraw()
  }
}
