// RULE-17 / I19: geometry crosses state only as page-relative 0-1 numbers, so a highlight survives zoom and rotation.
// "Normalized" is always measured on the UNROTATED page; "pixels" are always on the DISPLAYED (rotated, zoomed) box.

export type Rotation = 0 | 90 | 180 | 270

export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; w: number; h: number }
export type Size = { w: number; h: number }

/** The displayed box of a page: its natural size scaled by zoom, with w and h swapped at 90 and 270. */
export function displaySize(page: Size, zoom: number, rotation: Rotation): Size {
  const swap = rotation === 90 || rotation === 270
  return { w: (swap ? page.h : page.w) * zoom, h: (swap ? page.w : page.h) * zoom }
}

// Rotation is clockwise. u,v are the unrotated normalized coordinates; the result is the displayed normalized point.
function rotate(u: number, v: number, rotation: Rotation): Point {
  switch (rotation) {
    case 90:
      return { x: 1 - v, y: u }
    case 180:
      return { x: 1 - u, y: 1 - v }
    case 270:
      return { x: v, y: 1 - u }
    default:
      return { x: u, y: v }
  }
}

function unrotate(x: number, y: number, rotation: Rotation): Point {
  switch (rotation) {
    case 90:
      return { x: y, y: 1 - x }
    case 180:
      return { x: 1 - x, y: 1 - y }
    case 270:
      return { x: 1 - y, y: x }
    default:
      return { x, y }
  }
}

/** Normalized (unrotated page) -> pixels in the displayed box of `size`. */
export function denormalizePoint(p: Point, size: Size, rotation: Rotation): Point {
  const r = rotate(p.x, p.y, rotation)
  return { x: r.x * size.w, y: r.y * size.h }
}

/** Pixels in the displayed box of `size` -> normalized (unrotated page). */
export function normalizePoint(p: Point, size: Size, rotation: Rotation): Point {
  return unrotate(p.x / size.w, p.y / size.h, rotation)
}

function fromCorners(a: Point, b: Point): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
}

export function denormalizeRect(rect: Rect, size: Size, rotation: Rotation): Rect {
  return fromCorners(
    denormalizePoint({ x: rect.x, y: rect.y }, size, rotation),
    denormalizePoint({ x: rect.x + rect.w, y: rect.y + rect.h }, size, rotation)
  )
}

export function normalizeRect(rect: Rect, size: Size, rotation: Rotation): Rect {
  return fromCorners(
    normalizePoint({ x: rect.x, y: rect.y }, size, rotation),
    normalizePoint({ x: rect.x + rect.w, y: rect.y + rect.h }, size, rotation)
  )
}
