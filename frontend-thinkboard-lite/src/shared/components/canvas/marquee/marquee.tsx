"use client"

import { Layer, Rect } from "react-konva"
import { useMarquee } from "./use-marquee"
import type { MarqueeProps } from "./types"

/**
 * z2 canvas leaf (blueprint `canvasLeaves[marquee]`, `hasPainter: true`): a page-sized hit rect that is only
 * listening while a tool is armed, plus the painter's live stroke. Disarmed and fixture-free it renders
 * nothing at all — a page with no draw tool pays nothing and its pan/zoom is untouched (g2).
 */
export function Marquee(props: MarqueeProps) {
  const { layerRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useMarquee(props)
  const armed = props.tool !== null
  if (!armed && !props.fixtures?.length) return null
  return (
    <Layer ref={layerRef} listening={armed}>
      <Rect
        name="marquee-hit"
        x={0}
        y={0}
        width={props.size.w}
        height={props.size.h}
        fill="rgba(0,0,0,0.001)"
        listening={armed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerUp}
      />
    </Layer>
  )
}
