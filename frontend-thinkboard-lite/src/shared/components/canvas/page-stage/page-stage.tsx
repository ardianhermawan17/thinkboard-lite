"use client"

import { Layer, Stage } from "react-konva"
import { usePageStage } from "./use-page-stage"
import type { PageStageProps } from "./types"

/**
 * z0 canvas (PDF.js render) + z1 text layer (real, selectable spans — highlights capture from here, never z2) +
 * z2 Konva Stage host, empty until task 010/011 draw into it, per canvasLeaves[page-stage].hasPainter: false.
 * z3 DOM overlay is added by the container that mounts this leaf (chips, note pins), not here.
 */
export function PageStage({ doc, pageNumber, zoom, rotation, onZoomCommit, onTextLayerRendered, onCanvasRendered, children, interactive = true, drawing = false, onPointerAt }: PageStageProps) {
  const { canvasRef, textLayerRef, gestureRef, pageSize, onPointerDown, onPointerMove, onPointerUp } = usePageStage({
    doc,
    pageNumber,
    zoom,
    rotation,
    onZoomCommit,
    onTextLayerRendered,
    onCanvasRendered,
  })

  return (
    <div
      data-testid="page-stage"
      data-page={pageNumber}
      data-interactive={interactive}
      data-drawing={drawing}
      // g2 / 03 §7: touch-action is `none` only while a draw tool is armed (or the stage is inert behind a
      // note sheet), so a disarmed page keeps native pan/scroll instead of fighting every stroke.
      className={`relative select-none ${interactive ? "" : "pointer-events-none"} ${drawing || !interactive ? "touch-none" : "touch-pan-x touch-pan-y"}`}
      onPointerDown={(e) => onPointerDown(e.pointerId, e.clientX, e.clientY)}
      onPointerMove={(e) => {
        onPointerMove(e.pointerId, e.clientX, e.clientY)
        if (onPointerAt && pageSize.width > 0) {
          const rect = e.currentTarget.getBoundingClientRect()
          onPointerAt({ x: e.clientX - rect.left, y: e.clientY - rect.top }, { width: pageSize.width, height: pageSize.height })
        }
      }}
      onPointerUp={(e) => onPointerUp(e.pointerId)}
      onPointerCancel={(e) => onPointerUp(e.pointerId)}
    >
      <div ref={gestureRef} className="origin-center">
        {/* z0 */}
        <canvas ref={canvasRef} className="absolute inset-0" />
        {/* z1 */}
        <div ref={textLayerRef} className="textLayer absolute inset-0" />
        {/* z2 — host only; highlight-layer (010) and marquee (011) draw into it */}
        {pageSize.width > 0 && (
          <Stage width={pageSize.width} height={pageSize.height} className="absolute inset-0">
            {children ?? <Layer />}
          </Stage>
        )}
      </div>
    </div>
  )
}
