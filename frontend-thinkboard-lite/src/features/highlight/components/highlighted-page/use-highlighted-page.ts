import { useCallback, useMemo, useState } from "react"
import { useHighlightsForPage } from "@feature/entities/queries/use-highlights-for-page"
import { isBbox } from "../../types/bbox"
import type { StoredHighlight } from "@shared/components/canvas/highlight-layer"
import type { HighlightedPageProps } from "./types"

// Konva doesn't inherit CSS variables (globals.css's own note, 009/022): read the token once and hand the
// resolved string to the canvas leaf. No per-highlight color semantics are defined yet (out of scope for
// 010) -- every stored text highlight paints in the one default token until a later task assigns meaning.
function defaultHighlightColor(): string {
  if (typeof document === "undefined") return "oklch(0.9 0.17 95 / 45%)"
  return getComputedStyle(document.documentElement).getPropertyValue("--highlight-yellow").trim()
}

type TextLayerInfo = { element: HTMLDivElement; size: { width: number; height: number } }

export function useHighlightedPage({ artifactId, pageNumber }: HighlightedPageProps) {
  const rows = useHighlightsForPage(artifactId, pageNumber)
  const [textLayer, setTextLayer] = useState<TextLayerInfo | null>(null)

  const onTextLayerRendered = useCallback((element: HTMLDivElement, size: { width: number; height: number }) => {
    setTextLayer({ element, size })
  }, [])

  const highlights = useMemo<StoredHighlight[]>(() => {
    const color = defaultHighlightColor()
    return (rows ?? []).flatMap((row): StoredHighlight[] => (isBbox(row.bbox) ? [{ id: row.id, rects: row.bbox.rects, color }] : []))
  }, [rows])

  return { highlights, textLayer, onTextLayerRendered }
}
