"use client"

import { usePresenceContext } from "../presence-provider"
import type { PresenceRailState } from "./types"

/** g2: the rail reads the shared presence value (031) — it does not open its own channel. */
export function usePresenceRail(): PresenceRailState {
  const { peers, leaderDrawing, leaderId } = usePresenceContext()
  return { peers, leaderDrawing, leaderId }
}
