import { useCallback, useMemo, useState } from "react"
import { useHighlightsForPage } from "@feature/entities/queries/use-highlights-for-page"
import { isBbox } from "../../types/bbox"
import { DEFAULT_HIGHLIGHT_COLOUR } from "../../types/colour"
import { highlightColour } from "../../utils/highlight-colour"
import type { StoredHighlight } from "@shared/components/canvas/highlight-layer"
import type { HighlightedPageProps } from "./types"

type TextLayerInfo = { element: HTMLDivElement; size: { width: number; height: number } }

/**
 * 010's one default token became 043's four hues: every stored row paints in the hue it carries (`color: null`
 * reads as the default), and a newly drawn mark in the one the toolbar currently has chosen. Konva cannot read
 * CSS variables, so tokens are resolved here (globals.css's own note) and handed to the painter as strings.
 */
export function useHighlightedPage({ artifactId, pageNumber, colorKey }: HighlightedPageProps) {
  const rows = useHighlightsForPage(artifactId, pageNumber)
  const [textLayer, setTextLayer] = useState<TextLayerInfo | null>(null)
  // 011: the rendered z0 canvas, kept so a committed region can be cropped for OCR.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const onTextLayerRendered = useCallback((element: HTMLDivElement, size: { width: number; height: number }) => {
    setTextLayer({ element, size })
  }, [])

  const onCanvasRendered = useCallback((next: HTMLCanvasElement) => {
    setCanvas(next)
  }, [])

  // The live marquee stroke draws in the chosen hue, so it previews what the mark will be.
  const color = useMemo(() => highlightColour(colorKey ?? DEFAULT_HIGHLIGHT_COLOUR), [colorKey])

  const highlights = useMemo<StoredHighlight[]>(
    () => (rows ?? []).flatMap((row): StoredHighlight[] => (isBbox(row.bbox) ? [{ id: row.id, rects: row.bbox.rects, color: highlightColour(row.bbox.color) }] : [])),
    [rows]
  )

  return { highlights, textLayer, canvas, color, onTextLayerRendered, onCanvasRendered }
}
