"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createThrottle } from "@shared/utils/throttle"
import { openLiveChannel, type LiveHandle } from "./live-channel"
import type { Cursor, Peer } from "./types"

export type UsePresenceArgs = {
  sessionId: string
  profileId: string
  page: number
  /** Who the leader is, so a cursor from them raises the indicator (015 g4); null when unknown. */
  leaderId?: string | null
}

export type CursorListener = (cursors: Cursor[]) => void

/**
 * g1/g2/g4: peers and the leader indicator are low-frequency (React state); cursors are NOT — a ref map feeds
 * subscribers, so a 20 Hz cursor causes zero renders (RULE-20). One hook instance owns the one live channel.
 */
export function usePresence({ sessionId, profileId, page, leaderId }: UsePresenceArgs) {
  const [peers, setPeers] = useState<Peer[]>([])
  const [leaderDrawing, setLeaderDrawing] = useState(false)
  const handleRef = useRef<LiveHandle | null>(null)
  const throttleRef = useRef(createThrottle(50))
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageRef = useRef(page)
  const cursorsRef = useRef(new Map<string, Cursor>())
  const listenersRef = useRef(new Set<CursorListener>())

  useEffect(() => {
    pageRef.current = page
  }, [page])

  const notify = useCallback(() => {
    if (listenersRef.current.size === 0) return
    const cursors = [...cursorsRef.current.values()]
    for (const listener of listenersRef.current) listener(cursors)
  }, [])

  const stopLeaderDrawing = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = null
    setLeaderDrawing(false)
  }, [])

  useEffect(() => {
    // 028 g1: never subscribe to `live:` before a session and profile are known (context can be empty on first paint).
    if (!sessionId || !profileId) return
    const handle = openLiveChannel(sessionId, profileId, page, {
      onPeers: setPeers,
      onCursor: (cursor: Cursor) => {
        cursorsRef.current.set(cursor.profileId, cursor)
        notify()
        if (cursor.profileId !== leaderId || cursor.page !== pageRef.current) return
        if (cursor.drawing === false) {
          stopLeaderDrawing()
          return
        }
        setLeaderDrawing(true)
        if (clearTimer.current) clearTimeout(clearTimer.current)
        clearTimer.current = setTimeout(() => setLeaderDrawing(false), 1200) // idle fallback if no stroke-end arrives
      },
      onDrop: () => {
        cursorsRef.current.clear()
        notify()
        setPeers([])
      },
    })
    handleRef.current = handle
    return () => {
      handle.close()
      handleRef.current = null
      cursorsRef.current.clear()
      if (clearTimer.current) clearTimeout(clearTimer.current)
      clearTimer.current = null
    }
  }, [sessionId, profileId, page, leaderId, stopLeaderDrawing, notify])

  /** The layer subscribes; it is handed the current cursors immediately so a remount does not go blank. */
  const subscribe = useCallback((listener: CursorListener) => {
    listenersRef.current.add(listener)
    listener([...cursorsRef.current.values()])
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const publishCursor = useCallback(
    (x: number, y: number, cursorPage: number, drawing = true) => {
      if (!throttleRef.current.shouldSend({ x, y })) return
      handleRef.current?.publishCursor({ profileId, page: cursorPage, x, y, drawing })
    },
    [profileId]
  )

  return { peers, leaderDrawing, publishCursor, subscribe }
}
