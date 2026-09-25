"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createThrottle } from "@shared/utils/throttle"
import { openLiveChannel, type LiveHandle } from "./live-channel"
import type { Cursor, Peer } from "./types"

export type UsePresenceArgs = {
  sessionId: string
  profileId: string
  page: number
  /** Who the leader is, so a cursor from them raises the indicator (g4); null when unknown. */
  leaderId?: string | null
}

/**
 * g1/g4: presence and the leader indicator are low-frequency, so they are React state; cursors are NOT — the
 * container paints them from a ref. `publishCursor` throttles to ~20 Hz and only on real movement (RULE-20).
 */
export function usePresence({ sessionId, profileId, page, leaderId }: UsePresenceArgs) {
  const [peers, setPeers] = useState<Peer[]>([])
  const [leaderDrawing, setLeaderDrawing] = useState(false)
  const handleRef = useRef<LiveHandle | null>(null)
  const throttleRef = useRef(createThrottle(50))
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef(page)
  useEffect(() => {
    pageRef.current = page
  }, [page])

  const stopLeaderDrawing = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = null
    setLeaderDrawing(false)
  }, [])

  useEffect(() => {
    const handle = openLiveChannel(sessionId, profileId, page, {
      onPeers: setPeers,
      onCursor: (cursor: Cursor) => {
        if (cursor.profileId !== leaderId || cursor.page !== pageRef.current) return
        if (cursor.drawing === false) {
          stopLeaderDrawing()
          return
        }
        setLeaderDrawing(true)
        if (clearTimer.current) clearTimeout(clearTimer.current)
        clearTimer.current = setTimeout(() => setLeaderDrawing(false), 1200) // idle fallback if no stroke-end arrives
      },
      onDrop: () => setPeers([]),
    })
    handleRef.current = handle
    return () => {
      handle.close()
      handleRef.current = null
      if (clearTimer.current) clearTimeout(clearTimer.current)
      clearTimer.current = null
    }
  }, [sessionId, profileId, page, leaderId, stopLeaderDrawing])

  const publishCursor = useCallback(
    (x: number, y: number, drawing = true) => {
      if (!throttleRef.current.shouldSend({ x, y })) return
      handleRef.current?.publishCursor({ profileId, page: pageRef.current, x, y, drawing })
    },
    [profileId]
  )

  return { peers, leaderDrawing, publishCursor }
}
