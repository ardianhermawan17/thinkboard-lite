import type { ArtifactRow } from "@feature/entities/types"
import type { MarqueeTool } from "@shared/components/canvas/marquee"
import type { PdfDocument } from "@shared/lib/pdf"
import type { Rotation } from "@shared/utils/geometry"
import type { ReactNode } from "react"
import type { HighlightColour } from "../../types/colour"

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
  /** 011: which region tool is armed, or `null`. A future toolbar supplies it; default disarmed. */
  tool?: MarqueeTool | null
  /** 043: the hue a newly drawn mark is stored with. Omitted = the default (yellow). */
  colorKey?: HighlightColour
  /**
   * 031: an extra z2 node to render inside the page Stage (e.g. presence's cursor layer). A render prop, so the
   * overlay receives this page's displayed size/rotation without the highlight context importing presence (I3).
   */
  overlay?: (ctx: { pageNumber: number; size: { w: number; h: number }; rotation: Rotation }) => ReactNode
  /** 031: pointer passthrough used to publish cursors. */
  onPointerAt?: (point: { x: number; y: number }, size: { width: number; height: number }) => void
}
