"use client"

import Konva from "konva"
import type { DisplayCursor } from "./types"

// THE EXCEPTION (I17): the only file in this leaf allowed `new Konva.*`, node mutation or `batchDraw()`.
// Takes a layer ref plus display-space cursor points and returns a disposer — no store, no Dexie (I18). The
// points are already display pixels; a cursor is never persisted, so there is nothing to normalize (I19).
const DEFAULT_COLOR = "oklch(0.7 0.15 250)"

export function paintCursors(layer: Konva.Layer, cursors: DisplayCursor[], color = DEFAULT_COLOR): () => void {
  const nodes = cursors.map(
    (cursor) =>
      new Konva.Circle({
        x: cursor.x,
        y: cursor.y,
        radius: 5,
        fill: color,
        stroke: "white",
        strokeWidth: 1.5,
        listening: false, // a cursor must never steal a click from the page beneath it
      })
  )
  nodes.forEach((node) => layer.add(node))
  layer.batchDraw()
  return () => {
    nodes.forEach((node) => node.destroy())
    layer.batchDraw()
  }
}
