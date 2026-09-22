"use client"

import { HighlightLayer } from "@shared/components/canvas/highlight-layer"
import { PageStage } from "@shared/components/canvas/page-stage"
import type { UUID } from "@shared/types/domain/common"
import { TextHighlightCapture } from "../text-highlight-capture"
import { useHighlightedPage } from "./use-highlighted-page"
import type { HighlightedPageProps } from "./types"

/**
 * One page's full stack for the "highlight" context (blueprint: "capture, layers, promotion, import"):
 * page-stage (owned by `document`, a shared/ canvas leaf) plus highlight-layer drawing into its z2 and
 * text-highlight-capture listening over its z1. This is the composition `document-viewer`'s `renderPage`
 * slot is for — `document` and `highlight` never import each other directly (I3).
 */
export function HighlightedPage(props: HighlightedPageProps) {
  const { artifactId, profileId, pageNumber, doc, zoom, rotation, onZoomCommit } = props
  const { highlights, textLayer, onTextLayerRendered } = useHighlightedPage(props)

  return (
    <PageStage doc={doc} pageNumber={pageNumber} zoom={zoom} rotation={rotation} onZoomCommit={onZoomCommit} onTextLayerRendered={onTextLayerRendered}>
      <HighlightLayer highlights={highlights} size={{ w: textLayer?.size.width ?? 0, h: textLayer?.size.height ?? 0 }} rotation={rotation} />
      {textLayer && (
        <TextHighlightCapture
          artifactId={artifactId}
          profileId={profileId as UUID<"profiles">}
          page={pageNumber}
          textLayerElement={textLayer.element}
          textLayerSize={textLayer.size}
          rotation={rotation}
        />
      )}
    </PageStage>
  )
}
