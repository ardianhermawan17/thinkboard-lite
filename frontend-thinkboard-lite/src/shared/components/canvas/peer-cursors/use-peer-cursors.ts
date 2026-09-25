"use client"

import { useCallback, useEffect, useRef } from "react"
import type Konva from "konva"
import { paintCursors } from "./peer-cursors.painter"
import type { DisplayCursor, PeerCursorsProps } from "./types"

/**
 * g2 / RULE-20: cursors are not React state. `paint` is handed to the container once (via `register`); each
 * call replaces the previous paint, so the layer never accumulates nodes. The ref lives here, so a cursor at
 * 20 Hz causes zero renders.
 */
export function usePeerCursors({ color, register }: PeerCursorsProps = {}) {
  const layerRef = useRef<Konva.Layer>(null)
  const disposeRef = useRef<(() => void) | null>(null)

  const paint = useCallback(
    (cursors: DisplayCursor[]) => {
      disposeRef.current?.()
      disposeRef.current = layerRef.current ? paintCursors(layerRef.current, cursors, color) : null
    },
    [color]
  )

  useEffect(() => {
    register?.(paint)
  }, [register, paint])

  useEffect(
    () => () => {
      disposeRef.current?.()
      disposeRef.current = null
    },
    []
  )

  return { layerRef, paint }
}
