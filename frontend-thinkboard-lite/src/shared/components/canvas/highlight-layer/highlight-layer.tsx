"use client"

import { Layer } from "react-konva"
import { useHighlightLayer } from "./use-highlight-layer"
import type { HighlightLayerProps } from "./types"

/** z2 content: draws stored highlights via its painter (g4). Mounted inside page-stage's Stage. */
export function HighlightLayer(props: HighlightLayerProps) {
  const { layerRef } = useHighlightLayer(props)
  return <Layer ref={layerRef} listening={false} />
}
