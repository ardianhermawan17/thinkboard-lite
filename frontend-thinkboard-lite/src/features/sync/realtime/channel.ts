import type { RealtimeChannel } from "@supabase/supabase-js"
import type { RemoteEvent } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"
import { createEventBuffer, toRemoteEvent } from "./handlers"

const EVENTS = ["INSERT", "UPDATE", "DELETE", "RETRACT"] as const

export interface ChannelHandle {
  close(): void
}

export interface ChannelHooks {
  onBatch(events: RemoteEvent[]): Promise<void>
  onDrop(): void // the socket dropped: the engine reconnects and runs the reconcile BEFORE it listens again (05 §2.6)
}

/**
 * 05 §2.3: one socket, two private topics. `setAuth()` runs before the first subscribe AND after every token refresh:
 * without the second, the socket keeps the expired token and delivery stops about an hour in, silently (I22).
 */
export async function openChannels(sessionId: string, profileId: string, hooks: ChannelHooks): Promise<ChannelHandle> {
  const supabase = getSupabase()
  await supabase.realtime.setAuth()

  const buffer = createEventBuffer(hooks.onBatch)
  let closed = false
  const channels: RealtimeChannel[] = [`ws:${sessionId}`, `user:${profileId}`].map((topic) => {
    const channel = supabase.channel(topic, { config: { private: true } })
    for (const type of EVENTS) channel.on("broadcast", { event: type }, ({ payload }) => buffer.push(toRemoteEvent(type, payload)))
    return channel.subscribe((status) => {
      if (!closed && (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT")) hooks.onDrop()
    })
  })

  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === "TOKEN_REFRESHED") void supabase.realtime.setAuth()
  })

  return {
    close() {
      closed = true
      data.subscription.unsubscribe()
      buffer.dispose()
      for (const channel of channels) void supabase.removeChannel(channel)
    },
  }
}
