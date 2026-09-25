// Rungs 2 and 3 of the import ladder (spec §5.4): a flattened highlight is found by its ink, not by an
// annotation. HSV, keep S > 0.35 and V > 0.55 in the highlighter hue bands, dilate/erode is left to the
// caller's raster, connected components, then merge line boxes. Pure and deterministic; spec §5.4 suggests a
// Worker, which is a perf move, not a behaviour change (analyze.json NEW-1).
export type Box = { x: number; y: number; w: number; h: number }

const HUE_BANDS: [number, number][] = [
  [40, 70], // yellow
  [70, 160], // green
  [160, 200], // cyan
  [290, 340], // pink
]

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function isHighlighterPixel(r: number, g: number, b: number): boolean {
  const { h, s, v } = rgbToHsv(r, g, b)
  return s > 0.35 && v > 0.55 && HUE_BANDS.some(([lo, hi]) => h >= lo && h < hi)
}

export function maskFromRgba(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height)
  for (let i = 0; i < mask.length; i++) {
    const o = i * 4
    if (isHighlighterPixel(data[o], data[o + 1], data[o + 2])) mask[i] = 1
  }
  return mask
}

/** 4-neighbour connected components, filtered to the spec's minimums (drop < 8px tall or < 20px wide). */
export function connectedBoxes(mask: Uint8Array, width: number, height: number): Box[] {
  const seen = new Uint8Array(mask.length)
  const stack: number[] = []
  const boxes: Box[] = []
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    stack.length = 0
    stack.push(start)
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop()!
      const x = i % width
      const y = (i - x) / width
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      for (const n of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1]) {
        if (n >= 0 && mask[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    const w = maxX - minX + 1
    const h = maxY - minY + 1
    if (w >= 20 && h >= 8) boxes.push({ x: minX, y: minY, w, h })
  }
  return mergeLineBoxes(boxes)
}

function verticalOverlapRatio(a: Box, b: Box): number {
  const overlap = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  return overlap / Math.min(a.h, b.h)
}

/** Merge boxes sharing more than 60% of their vertical span into one line box (spec §5.4). */
export function mergeLineBoxes(boxes: Box[]): Box[] {
  const merged: Box[] = []
  for (const box of [...boxes].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const into = merged.find((m) => verticalOverlapRatio(m, box) > 0.6)
    if (!into) {
      merged.push({ ...box })
      continue
    }
    const minX = Math.min(into.x, box.x)
    const maxX = Math.max(into.x + into.w, box.x + box.w)
    const minY = Math.min(into.y, box.y)
    const maxY = Math.max(into.y + into.h, box.y + box.h)
    into.x = minX
    into.y = minY
    into.w = maxX - minX
    into.h = maxY - minY
  }
  return merged
}
