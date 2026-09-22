import type { ArtifactRow } from "@feature/entities/types"
import type { PdfDocument } from "@shared/lib/pdf"
import type { Rotation } from "@shared/utils/geometry"
import type { UUID } from "@shared/types/domain/common"
import type { ReactNode } from "react"

export type DocumentViewerPageArgs = {
  doc: PdfDocument
  artifactId: ArtifactRow["id"] | null
  profileId: string | null
  pageNumber: number
  zoom: number
  rotation: Rotation
  onZoomCommit: (zoom: number) => void
}

export type DocumentViewerProps = {
  sessionId: UUID<"sessions">
  /**
   * Injection point for a cross-feature page composition (e.g. highlight's `HighlightedPage`): `document`
   * may not import `@feature/highlight` directly (I3), so whoever composes both contexts — an app route
   * today, since neither is wired into one yet — supplies this. Defaults to a bare `PageStage`.
   */
  renderPage?: (args: DocumentViewerPageArgs) => ReactNode
}

export type DocumentViewerState = {
  doc: PdfDocument | null
  artifactId: ArtifactRow["id"] | null
  profileId: string | null
  error: string | null
  pages: number[]
  zoom: number
  rotation: 0 | 90 | 180 | 270
  onZoomCommit: (zoom: number) => void
}
