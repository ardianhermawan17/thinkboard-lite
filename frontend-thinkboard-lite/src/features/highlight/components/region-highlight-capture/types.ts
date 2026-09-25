import type { ArtifactRow } from "@feature/entities/types"
import type { MarqueeTool } from "@shared/components/canvas/marquee"
import type { Rotation } from "@shared/utils/geometry"

export type RegionHighlightCaptureProps = {
  artifactId: ArtifactRow["id"]
  profileId: string
  page: number
  /** `null` = no draw tool armed; the leaf renders nothing and captures nothing. */
  tool: MarqueeTool | null
  /** The displayed page box in CSS pixels (the Stage's own size). */
  size: { w: number; h: number }
  rotation: Rotation
  /** z0's rendered page canvas — the source the OCR crop is taken from. Null until the page paints. */
  canvas: HTMLCanvasElement | null
  /** Live-stroke colour (a resolved token). The stored highlight colour stays `null`, like 010's. */
  color?: string
}
