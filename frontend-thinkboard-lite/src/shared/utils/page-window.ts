/** g2: which pages get a live Konva Stage — the cursor and one neighbour each side, clipped to the document (03 §6.2, hazard 7). */
export function pageWindow(cursor: number, pageCount: number): number[] {
  if (pageCount <= 0) return []
  const lo = Math.max(1, cursor - 1)
  const hi = Math.min(pageCount, cursor + 1)
  const pages: number[] = []
  for (let p = lo; p <= hi; p++) pages.push(p)
  return pages
}
