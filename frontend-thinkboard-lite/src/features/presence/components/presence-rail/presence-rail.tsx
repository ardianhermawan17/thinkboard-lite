"use client"

import { LeaderDrawing } from "../leader-drawing"
import { usePresenceRail } from "./use-presence-rail"

/** g2/g3: who is here, plus the leader indicator. A container leaf; its hook owns the state. */
export function PresenceRail() {
  const { peers, leaderDrawing } = usePresenceRail()
  return (
    <div data-testid="presence-rail" className="ml-auto flex items-center gap-2 rounded-pill border border-border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground">
      <span>{peers.length === 0 ? "Only you" : `${peers.length} here`}</span>
      <LeaderDrawing visible={leaderDrawing} />
    </div>
  )
}
