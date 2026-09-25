"use client"

import type { Point } from "@shared/utils/geometry"

/**
 * Deterministic canvas-leaf story fixtures (04 §10). `manyPoints` defaults to 220 — over the plan's
 * `ManyStrokes` (≥200 points) perf case; `lassoPoints` is a closed freehand region.
 */
export function manyPoints(count = 220): Point[] {
  return Array.from({ length: count }, (_, i) => ({ x: 120 + i * 1.4, y: 150 + Math.sin(i / 6) * 50 }))
}

export function lassoPoints(count = 36): Point[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = (i / count) * Math.PI * 2
    return { x: 250 + Math.cos(t) * 95, y: 160 + Math.sin(t) * 75 }
  })
}
