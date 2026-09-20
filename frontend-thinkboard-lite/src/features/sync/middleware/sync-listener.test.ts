import { startAppListening, listenerMiddleware } from "@shared/config/redux/listener"
import { makeStore } from "@shared/config/redux/store"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ChannelHandle } from "../realtime/channel"
import { registerSyncListeners } from "./sync-listener"
import type { EngineDeps } from "./engine"

const calls: string[] = []
const close = vi.fn()
let queuedCb: (n: number) => void = () => {}
const deps: EngineDeps = {
  bootstrap: async () => (calls.push("bootstrap"), ["art"]),
  drain: async () => (calls.push("push"), { sent: [], parked: [], stopped: "empty" }),
  pullMeta: async () => void calls.push("pullMeta"),
  reconcile: async () => void calls.push("pull"),
  openChannels: async () => (calls.push("resubscribe"), { close } satisfies ChannelHandle),
  watchQueued: (cb) => ((queuedCb = cb), () => {}),
  sleep: async () => {},
  now: () => "2026-09-20T12:00:00.000Z",
}

let stop: () => void
beforeEach(() => {
  calls.length = 0
  close.mockClear()
  listenerMiddleware.clearListeners() // store.ts registered the real engine at import; this test wires fakes
  stop = registerSyncListeners(startAppListening, deps)
})
afterEach(() => stop())

const open = () => {
  const store = makeStore()
  store.dispatch({ type: "workspace/signedIn", payload: { profileId: "p" } })
  store.dispatch({ type: "workspace/workspaceOpened", payload: { teamId: "t", sessionId: "s" } })
  return store
}

describe("sync listener (g5)", () => {
  it("opening a workspace runs the cycle in protocol order and records the steps as actions", async () => {
    const store = open()
    await vi.waitFor(() => expect(store.getState().sync.ui.lastSyncedAt).toBe("2026-09-20T12:00:00.000Z"))
    expect(calls).toEqual(["bootstrap", "push", "pullMeta", "pull", "resubscribe"])
    expect(store.getState().sync.ui.syncing).toBe(false)
  })

  it("going offline closes the socket; coming back runs push -> pull -> resubscribe again", async () => {
    const store = open()
    await vi.waitFor(() => expect(calls).toContain("resubscribe"))
    calls.length = 0

    store.dispatch({ type: "sync/phaseChanged", payload: "offline" })
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1))
    expect(calls).toEqual([]) // nothing runs while offline

    store.dispatch({ type: "sync/phaseChanged", payload: "collaboration" })
    await vi.waitFor(() => expect(calls).toContain("resubscribe"))
    expect(calls).toEqual(["bootstrap", "push", "pullMeta", "pull", "resubscribe"])
  })

  it("a write while connected drains at once and reports the pending count", async () => {
    const store = open()
    await vi.waitFor(() => expect(calls).toContain("resubscribe"))
    calls.length = 0
    queuedCb(2)
    await vi.waitFor(() => expect(calls).toEqual(["push"]))
    expect(store.getState().sync.ui.pendingCount).toBe(2)
  })

  it("a write while offline is only queued: nothing is sent until the phase returns", async () => {
    const store = open()
    await vi.waitFor(() => expect(calls).toContain("resubscribe"))
    store.dispatch({ type: "sync/phaseChanged", payload: "offline" })
    calls.length = 0
    queuedCb(3)
    await new Promise((r) => setTimeout(r, 30))
    expect(calls).toEqual([])
    expect(store.getState().sync.ui.pendingCount).toBe(3)
  })
})
