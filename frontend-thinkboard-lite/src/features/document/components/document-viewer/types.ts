import type { PdfDocument } from "@shared/lib/pdf"
import type { UUID } from "@shared/types/domain/common"

export type DocumentViewerProps = {
  sessionId: UUID<"sessions">
}

export type DocumentViewerState = {
  doc: PdfDocument | null
  error: string | null
  pages: number[]
  zoom: number
  rotation: 0 | 90 | 180 | 270
  onZoomCommit: (zoom: number) => void
}
