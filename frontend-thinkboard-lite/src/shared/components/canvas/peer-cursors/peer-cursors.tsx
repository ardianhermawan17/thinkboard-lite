"use client"

import { Layer } from "react-konva"
import { usePeerCursors } from "./use-peer-cursors"
import type { PeerCursorsProps } from "./types"

/** z2 canvas leaf (blueprint `canvasLeaves[peer-cursors]`, `hasPainter: true`): a passive layer the presence
 * container paints into through the registered `paint` function. It renders no cursor itself. */
export function PeerCursors(props: PeerCursorsProps) {
  const { layerRef } = usePeerCursors(props)
  return <Layer ref={layerRef} listening={false} />
}
