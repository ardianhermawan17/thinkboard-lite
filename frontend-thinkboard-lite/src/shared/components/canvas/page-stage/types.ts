import type { PdfDocument } from "@shared/lib/pdf"
import type { Rotation } from "@shared/utils/geometry"
import type { ReactNode } from "react"

export type PageStageProps = {
  doc: PdfDocument
  pageNumber: number
  zoom: number
  rotation: Rotation
  /** Fires once, when a pinch gesture ends — the committed zoom (03 §5, "60 fps transient... never through React"). */
  onZoomCommit?: (zoom: number) => void
  /**
   * Fires after every (re)render of z1: hands the text-layer element and its displayed size to a
   * features-level container (010's text-highlight-capture), since a canvas leaf may not import
   * `@feature/*` itself (I3) and so cannot capture a selection on its own behalf.
   */
  onTextLayerRendered?: (element: HTMLDivElement, size: { width: number; height: number }) => void
  /** z2 content — react-konva nodes only (e.g. highlight-layer, later marquee). Rendered inside the Stage. */
  children?: ReactNode
}
