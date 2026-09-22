import type { PdfDocument } from "@shared/lib/pdf"
import type { Rotation } from "@shared/utils/geometry"

export type PageStageProps = {
  doc: PdfDocument
  pageNumber: number
  zoom: number
  rotation: Rotation
  /** Fires once, when a pinch gesture ends — the committed zoom (03 §5, "60 fps transient... never through React"). */
  onZoomCommit?: (zoom: number) => void
}
