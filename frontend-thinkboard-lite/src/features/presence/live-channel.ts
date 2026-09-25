import { getSupabase } from "@shared/lib/supabase"
import type { Cursor, Peer } from "./types"

export type LiveHooks = {
  onPeers(peers: Peer[]): void
  onCursor(cursor: Cursor): void
  onDrop(): void
}

export type LiveHandle = { publishCursor(cursor: Cursor): void; close(): void }

/** Supabase's presence state -> the flat peer list the UI wants. Pure, so the shape is testable. */
export function presenceToPeers(state: Record<string, Array<Record<string, unknown>>>): Peer[] {
  const peers: Peer[] = []
  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (typeof entry.profileId === "string" && typeof entry.page === "number") peers.push({ profileId: entry.profileId, page: entry.page })
    }
  }
  return peers
}

/**
 * g6 / DB-Q9: the one client-sent topic. `live:{sessionId}` carries presence and cursors; `ws:`/`user:` stay
 * database-sent only (migration 0006 grants no client insert there, so a member cannot forge a database-change
 * event into a teammate's Dexie). Private channel, keyed by profileId, exactly 007's setAuth discipline.
 */
export function openLiveChannel(sessionId: string, profileId: string, page: number, hooks: LiveHooks): LiveHandle {
  const supabase = getSupabase()
  const channel = supabase.channel(`live:${sessionId}`, { config: { private: true, presence: { key: profileId } } })
  channel
    .on("presence", { event: "sync" }, () => hooks.onPeers(presenceToPeers(channel.presenceState() as unknown as Record<string, Array<Record<string, unknown>>>)))
    .on("broadcast", { event: "cursor" }, ({ payload }) => hooks.onCursor(payload as Cursor))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void channel.track({ profileId, page })
      else if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") hooks.onDrop()
    })
  return {
    publishCursor: (cursor) => void channel.send({ type: "broadcast", event: "cursor", payload: cursor }),
    close: () => void supabase.removeChannel(channel),
  }
}
