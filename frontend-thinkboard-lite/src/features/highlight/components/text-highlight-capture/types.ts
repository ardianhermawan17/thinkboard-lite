import type { ArtifactRow } from "@feature/entities/types"
import type { UUID } from "@shared/types/domain/common"
import type { HighlightColour } from "../../types/colour"

export type TextHighlightCaptureProps = {
  artifactId: ArtifactRow["id"]
  profileId: UUID<"profiles">
  page: number
  /** The z1 element and its displayed size, handed up from page-stage via onTextLayerRendered. */
  textLayerElement: HTMLDivElement
  textLayerSize: { width: number; height: number }
  rotation: 0 | 90 | 180 | 270
  /** 043: stored on the mark so the four hues survive a reload; omitted = the default. */
  colorKey?: HighlightColour
}
