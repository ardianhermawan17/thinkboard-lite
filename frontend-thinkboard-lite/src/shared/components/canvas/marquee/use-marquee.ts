"use client"

import { useCallback, useEffect, useRef } from "react"
import type Konva from "konva"
import { normalizePoint, type Point, type Rotation } from "@shared/utils/geometry"
import { shouldCapture, withPenSeen } from "@shared/utils/stylus"
import { createStrokePainter, paintStroke, type MarqueePainter } from "./marquee.painter"
import type { MarqueePointerEvent, MarqueeProps, MarqueeStroke, MarqueeTool } from "./types"

function stagePoint(e: MarqueePointerEvent): Point | null {
  const position = e.target.getStage()?.getPointerPosition()
  return position ? { x: position.x, y: position.y } : null
}

/** Pixels (displayed space) -> the one normalized bounding rect + points (page-relative, RULE-17/I19). */
function toStroke(tool: MarqueeTool | null, pixels: Point[], size: { w: number; h: number }, rotation: Rotation): MarqueeStroke | null {
  if (!tool || size.w === 0 || size.h === 0 || pixels.length === 0) return null
  const points = pixels.map((p) => normalizePoint(p, size, rotation))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const w = maxX - minX
  const h = maxY - minY
  if (w <= 0 || h <= 0) return null // a tap, not a region
  return { tool, rects: [{ x: minX, y: minY, w, h }], points }
}

/**
 * The marquee leaf's logic: Pointer-Event capture with session palm rejection (g2), a ref-held live stroke
 * painted only by the painter (never React state — 03 §5), and normalization on commit (I19). No store, no
 * Dexie: a container supplies `onCommit`. While a tool is armed the leaf swallows the pointer so page-stage's
 * pan/zoom does not fight the stroke; disarmed, it never captures, so scrolling works (g2's acceptance).
 */
export function useMarquee({ tool, size, rotation, color, fixtures, onCommit }: MarqueeProps) {
  const layerRef = useRef<Konva.Layer>(null)
  const painterRef = useRef<MarqueePainter | null>(null)
  const draggingRef = useRef(false)
  const penSeenRef = useRef(false)

  const ensurePainter = useCallback((): MarqueePainter | null => {
    if (!tool || !layerRef.current) return null
    if (!painterRef.current) painterRef.current = createStrokePainter(layerRef.current, tool, color ? { color } : {})
    return painterRef.current
  }, [tool, color])

  // Dispose the live painter when the tool changes or the leaf unmounts.
  useEffect(() => {
    return () => {
      painterRef.current?.dispose()
      painterRef.current = null
      draggingRef.current = false
    }
  }, [tool])

  // Fixture strokes (Storybook) are painted once per fixture set and never committed.
  useEffect(() => {
    const layer = layerRef.current
    if (!layer || !fixtures?.length) return
    const disposers = fixtures.map((points) => paintStroke(layer, points, color ? { color } : {}))
    return () => disposers.forEach((dispose) => dispose())
  }, [fixtures, color])

  const onPointerDown = useCallback(
    (e: MarqueePointerEvent) => {
      penSeenRef.current = withPenSeen(penSeenRef.current, e.evt.pointerType)
      if (!tool || draggingRef.current) return
      if (!shouldCapture(e.evt.pointerType, penSeenRef.current)) return
      const point = stagePoint(e)
      if (!point) return
      e.cancelBubble = true
      e.evt.stopPropagation()
      e.evt.preventDefault()
      draggingRef.current = true
      ensurePainter()?.push(point)
    },
    [tool, ensurePainter]
  )

  const onPointerMove = useCallback(
    (e: MarqueePointerEvent) => {
      if (!tool || !draggingRef.current) return
      const point = stagePoint(e)
      if (!point) return
      e.cancelBubble = true
      ensurePainter()?.push(point)
    },
    [tool, ensurePainter]
  )

  const onPointerUp = useCallback(
    (e: MarqueePointerEvent) => {
      if (!draggingRef.current) return
      e.cancelBubble = true
      e.evt.stopPropagation()
      draggingRef.current = false
      const painter = painterRef.current
      if (!painter) return
      const point = stagePoint(e)
      if (point) painter.push(point)
      const stroke = toStroke(tool, painter.commit(), size, rotation)
      painter.clear()
      if (stroke) onCommit?.(stroke)
    },
    [tool, size, rotation, onCommit]
  )

  const onPointerCancel = useCallback((e: MarqueePointerEvent) => {
    if (!draggingRef.current) return
    e.cancelBubble = true
    e.evt.stopPropagation()
    draggingRef.current = false
    painterRef.current?.clear()
  }, [])

  return { layerRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
