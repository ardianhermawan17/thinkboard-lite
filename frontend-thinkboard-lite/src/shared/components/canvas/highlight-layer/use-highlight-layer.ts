"use client"

import { useEffect, useMemo, useRef } from "react"
import type Konva from "konva"
import { denormalizeRect } from "@shared/utils/geometry"
import { paintHighlights, type PaintedRect } from "./highlight-layer.painter"
import type { HighlightLayerProps } from "./types"

/**
 * Derivation only (I18): denormalizes each stored highlight's rects against the page's current size and
 * rotation, then hands plain pixel data to the painter. No store, no Dexie — a container supplies `highlights`.
 */
export function useHighlightLayer({ highlights, size, rotation }: HighlightLayerProps) {
  const layerRef = useRef<Konva.Layer>(null)

  const rects = useMemo<PaintedRect[]>(() => {
    if (size.w === 0 || size.h === 0) return []
    return highlights.flatMap((h) => h.rects.map((r) => ({ ...denormalizeRect(r, size, rotation), color: h.color })))
  }, [highlights, size, rotation])

  useEffect(() => {
    if (!layerRef.current) return
    return paintHighlights(layerRef.current, rects)
  }, [rects])

  return { layerRef, rects }
}
