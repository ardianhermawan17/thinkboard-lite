"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { renderPage, renderTextLayer } from "@shared/lib/pdf"
import { MAX_ZOOM, MIN_ZOOM } from "@shared/utils/zoom-bounds"
import { midpoint, panDelta, pinchScale, type TrackedPoint } from "@shared/utils/pointer-gesture"
import type { PageStageProps } from "./types"

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Renders one page (z0 canvas, z1 text layer) and tracks a pinch/pan gesture over it. No Redux, no Dexie (a canvas
 * leaf hook is presentational): the gesture is applied as a CSS transform on `gestureRef` while it is live, and
 * `onZoomCommit` is the only thing that ever reaches the store, once, when the last finger lifts.
 */
export function usePageStage({ doc, pageNumber, zoom, rotation, onZoomCommit }: PageStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, TrackedPoint>())
  const pinchStart = useRef<{ points: [TrackedPoint, TrackedPoint]; mid: TrackedPoint; zoom: number } | null>(null)
  // z2's size: the Konva Stage must match z0's rendered pixels exactly, or the layers drift apart.
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    let cancelled = false
    async function paint() {
      const canvas = canvasRef.current
      const textLayer = textLayerRef.current
      if (!canvas || !textLayer) return
      const size = await renderPage(doc, pageNumber, canvas, zoom)
      if (cancelled) return
      setPageSize(size)
      textLayer.replaceChildren()
      await renderTextLayer(doc, pageNumber, textLayer, zoom)
    }
    void paint()
    return () => {
      cancelled = true
    }
  }, [doc, pageNumber, zoom, rotation])

  const applyTransform = useCallback((scale: number, dx: number, dy: number) => {
    if (gestureRef.current) gestureRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
  }, [])

  const resetTransform = useCallback(() => applyTransform(1, 0, 0), [applyTransform])

  const beginPinchIfTwo = useCallback(() => {
    if (pointers.current.size !== 2) return
    const [a, b] = [...pointers.current.values()] as [TrackedPoint, TrackedPoint]
    pinchStart.current = { points: [a, b], mid: midpoint(a, b), zoom }
  }, [zoom])

  const onPointerDown = useCallback(
    (pointerId: number, x: number, y: number) => {
      pointers.current.set(pointerId, { x, y })
      beginPinchIfTwo()
    },
    [beginPinchIfTwo]
  )

  const onPointerMove = useCallback((pointerId: number, x: number, y: number) => {
    if (!pointers.current.has(pointerId)) return
    pointers.current.set(pointerId, { x, y })
    const start = pinchStart.current
    if (!start || pointers.current.size !== 2) return
    const [a, b] = [...pointers.current.values()] as [TrackedPoint, TrackedPoint]
    const scale = pinchScale(start.points, [a, b])
    const delta = panDelta(start.mid, midpoint(a, b))
    applyTransform(scale, delta.x, delta.y)
  }, [applyTransform])

  const onPointerUp = useCallback(
    (pointerId: number) => {
      const start = pinchStart.current
      if (start && pointers.current.size >= 2) {
        const finalPoints = [...pointers.current.values()] as [TrackedPoint, TrackedPoint]
        const scale = pinchScale(start.points, finalPoints)
        onZoomCommit?.(clamp(start.zoom * scale, MIN_ZOOM, MAX_ZOOM))
      }
      pointers.current.delete(pointerId)
      if (pointers.current.size < 2) {
        pinchStart.current = null
        resetTransform()
      }
    },
    [onZoomCommit, resetTransform]
  )

  return { canvasRef, textLayerRef, gestureRef, pageSize, onPointerDown, onPointerMove, onPointerUp }
}
