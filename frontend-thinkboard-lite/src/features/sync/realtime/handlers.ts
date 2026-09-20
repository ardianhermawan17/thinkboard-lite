import type { RemoteEvent } from "@feature/entities"

type BroadcastPayload = { table: string; record?: Record<string, unknown> | null; old_record?: Record<string, unknown> | null }

/** `realtime.broadcast_changes` payload -> what `applyRemote` takes. The event NAME is the type (RETRACT arrives with operation DELETE). */
export function toRemoteEvent(type: RemoteEvent["type"], payload: BroadcastPayload): RemoteEvent {
  return { type, table: payload.table, record: payload.record ?? null, oldRecord: payload.old_record ?? null }
}

/**
 * F5: a burst (a leader import is ~80 broadcasts) is collected for a moment and applied as ONE batch, so a tablet runs one
 * Dexie transaction and one live-query re-run instead of eighty.
 */
export function createEventBuffer(flush: (events: RemoteEvent[]) => void | Promise<void>, delayMs = 25) {
  let buffer: RemoteEvent[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  async function run() {
    if (timer) clearTimeout(timer)
    timer = null
    const batch = buffer
    buffer = []
    if (batch.length > 0) await flush(batch)
  }

  return {
    push(event: RemoteEvent) {
      buffer.push(event)
      timer ??= setTimeout(() => void run(), delayMs)
    },
    flushNow: run,
    dispose() {
      if (timer) clearTimeout(timer)
      timer = null
      buffer = []
    },
  }
}
