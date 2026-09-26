"use client"

import { useCallback, useEffect, useRef } from "react"
import type { DisplayCursor } from "@shared/components/canvas/peer-cursors"
import { denormalizePoint } from "@shared/utils/geometry"
import { usePresenceContext } from "../presence-provider"
import type { PresenceLayerProps } from "./types"

/**
 * g2: turns the cursor store into painter calls. The subscribe callback runs on every incoming cursor (20 Hz),
 * so it touches only a ref and the leaf's paint function — never React state (RULE-20). The wire is
 * page-relative 0-1, denormalized here with THIS page's size and rotation (RULE-17).
 */
export function usePresenceLayer({ page, size, rotation }: PresenceLayerProps) {
  const { subscribe } = usePresenceContext()
  const paintRef = useRef<((cursors: DisplayCursor[]) => void) | null>(null)

  const register = useCallback((paint: (cursors: DisplayCursor[]) => void) => {
    paintRef.current = paint
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe((cursors) => {
      const visible = cursors
        .filter((cursor) => cursor.page === page)
        .map((cursor) => {
          const p = denormalizePoint({ x: cursor.x, y: cursor.y }, size, rotation)
          return { id: cursor.profileId, x: p.x, y: p.y }
        })
      paintRef.current?.(visible)
    })
    return () => {
      unsubscribe()
      paintRef.current?.([])
    }
  }, [subscribe, page, size, rotation])

  return { register }
}
