import type { PayloadAction } from "@reduxjs/toolkit"
import { startAppListening } from "@shared/config/redux/listener"
import type { ChannelHandle } from "../realtime/channel"
import { networkDownSet, outboxQueued, phaseChanged, remoteChangeReceived, syncFailed, syncFinished, syncStarted } from "../stores/sync-slice"
import { drainAndRefresh, realDeps, runSyncCycle, type Ctx, type EngineDeps } from "./engine"

type StartListening = typeof startAppListening

interface Active {
  ctx: Ctx
  ac: AbortController
  channel: ChannelHandle | null
  cycling: boolean
  stop(): void
}

/**
 * 03 §6.4: the engine is listener middleware, not a mounted component, so a route change cannot unmount it and every step is a
 * dispatched action. It reacts to `workspaceOpened`, to `phaseChanged` (the reconnect sequence) and to the outbox growing.
 * Registered once from store.ts.
 */
export function registerSyncListeners(start: StartListening = startAppListening, deps: EngineDeps = realDeps): () => void {
  let active: Active | null = null
  const stopActive = () => {
    active?.stop()
    active = null
  }

  /** One full cycle, retried with backoff until it succeeds or is cancelled (a phase change, another workspace, sign-out). */
  const cycle = async (api: Parameters<Parameters<StartListening>[0]["effect"]>[1], a: Active) => {
    a.ac.abort()
    a.channel?.close()
    a.channel = null
    if (api.getState().sync.phase !== "collaboration") return
    a.ac = new AbortController()
    const signal = a.ac.signal
    a.cycling = true
    try {
      for (let attempt = 0; !signal.aborted; attempt++) {
        api.dispatch(syncStarted())
        const events = { onRemote: (count: number) => api.dispatch(remoteChangeReceived(count)), onDrop: () => void cycle(api, a) }
        const result = await runSyncCycle(deps, a.ctx, signal, events, attempt)
        if (signal.aborted) return void (result.ok && result.channel.close())
        if (result.ok) {
          a.channel = result.channel
          return void api.dispatch(syncFinished({ at: deps.now() }))
        }
        api.dispatch(syncFailed(result.error))
        await deps.sleep(result.retryInMs, signal)
      }
    } finally {
      a.cycling = false
    }
  }

  const unsubscribeOpened = start({
    predicate: (action) => action.type === "workspace/workspaceOpened",
    effect: async (action, api) => {
      stopActive()
      const { teamId, sessionId } = (action as PayloadAction<{ teamId: string; sessionId: string }>).payload
      const profileId = api.getState().workspace.profileId
      if (!profileId) return

      // g1 / spec §5.3: auto-detect may only DEGRADE into offline. Coming back online records the fact and
      // stops there — the banner's explicit button is what resumes (a manual Work-offline choice is never
      // overridden, and no reconnect is ever silent).
      const online = () => api.dispatch(networkDownSet(false))
      const offline = () => api.dispatch(networkDownSet(true))
      window.addEventListener("online", online)
      window.addEventListener("offline", offline)

      let draining = false
      const unwatch = deps.watchQueued((count) => {
        api.dispatch(outboxQueued({ count }))
        // a write while connected drains at once; the cycle itself drains first thing, so it is skipped while one runs
        if (count === 0 || draining || a.cycling || api.getState().sync.phase !== "collaboration") return
        draining = true
        void drainAndRefresh(deps, a.ctx, a.ac.signal)
          .then((r) => (r.stopped === "transient" ? deps.sleep(r.retryInMs ?? 1000, a.ac.signal).then(() => void cycle(api, a)) : undefined))
          .finally(() => (draining = false))
      })

      const a: Active = {
        ctx: { teamId, sessionId, profileId },
        ac: new AbortController(),
        channel: null,
        cycling: false,
        stop() {
          a.ac.abort()
          a.channel?.close()
          a.channel = null
          unwatch()
          window.removeEventListener("online", online)
          window.removeEventListener("offline", offline)
        },
      }
      active = a
      // A persisted manual choice outranks the browser; otherwise start from the browser's own state.
      api.dispatch(phaseChanged(api.getState().sync.manualOffline || !navigator.onLine ? "offline" : "collaboration"))
      if (!navigator.onLine) api.dispatch(networkDownSet(true))
      await cycle(api, a)
    },
  })

  // 05 §2.5: offline -> collaboration is the reconnect sequence (push, pull, resubscribe); going offline cancels the cycle and the sockets
  const unsubscribePhase = start({
    predicate: (action, current, previous) => action.type === "sync/phaseChanged" && current.sync.phase !== previous.sync.phase,
    effect: async (_action, api) => {
      if (!active) return
      if (api.getState().sync.phase === "offline") {
        active.ac.abort()
        active.channel?.close()
        active.channel = null
        return
      }
      await cycle(api, active)
    },
  })

  return () => {
    unsubscribeOpened()
    unsubscribePhase()
    stopActive()
  }
}
