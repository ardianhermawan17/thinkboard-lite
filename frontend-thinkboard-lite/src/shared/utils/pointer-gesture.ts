/**
 * Pure two-pointer math for pinch-zoom and two-finger pan (03 §7): Pointer Events only, never mouse-only.
 * No React, no Konva — the hook holds the pointer map in a ref and calls these on every pointermove.
 */
export type TrackedPoint = { x: number; y: number }

export function distance(a: TrackedPoint, b: TrackedPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function midpoint(a: TrackedPoint, b: TrackedPoint): TrackedPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/** The zoom multiplier implied by two pointers moving from `start` to `current`; 1 = unchanged. Guards a zero start distance. */
export function pinchScale(start: [TrackedPoint, TrackedPoint], current: [TrackedPoint, TrackedPoint]): number {
  const startDist = distance(start[0], start[1])
  if (startDist === 0) return 1
  return distance(current[0], current[1]) / startDist
}

/** How far the gesture's midpoint moved — the pan delta for a one- or two-finger drag. */
export function panDelta(start: TrackedPoint, current: TrackedPoint): TrackedPoint {
  return { x: current.x - start.x, y: current.y - start.y }
}
