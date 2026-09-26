"use client"

import { PeerCursors } from "@shared/components/canvas/peer-cursors"
import { usePresenceLayer } from "./use-presence-layer"
import type { PresenceLayerProps } from "./types"

/** g2: the z2 layer that draws peers' cursors. Renders the passive leaf; its hook drives the paint. */
export function PresenceLayer(props: PresenceLayerProps) {
  const { register } = usePresenceLayer(props)
  return <PeerCursors register={register} />
}
