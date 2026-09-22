import type { ArtifactRow } from "@feature/entities/types"
import type { PdfDocument } from "@shared/lib/pdf"
import type { Rotation } from "@shared/utils/geometry"

/**
 * Plain props only — no import from `@feature/document` (I3: a feature may import only
 * `@feature/entities` and `@feature/sync` from another feature). Whoever composes `document` and
 * `highlight` together (the app route, or `document-viewer`'s `renderPage` slot) supplies these directly.
 */
export type HighlightedPageProps = {
  doc: PdfDocument
  artifactId: ArtifactRow["id"]
  profileId: string
  pageNumber: number
  zoom: number
  rotation: Rotation
  onZoomCommit: (zoom: number) => void
}
