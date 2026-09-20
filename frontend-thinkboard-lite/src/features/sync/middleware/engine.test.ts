import { describe, expect, it, vi } from "vitest"
import type { ChannelHandle } from "../realtime/channel"
import { runSyncCycle, type EngineDeps } from "./engine"

function harness(drain: EngineDeps["drain"]) {
  const calls: string[] = []
  const channel: ChannelHandle = { close: vi.fn() }
  const deps: EngineDeps = {
    bootstrap: async () => (calls.push("bootstrap"), ["art"]),
    drain: async (s) => (calls.push("push"), drain(s)),
    pullMeta: async () => void calls.push("pullMeta"),
    reconcile: async () => void calls.push("pull"),
    openChannels: async () => (calls.push("resubscribe"), channel),
    watchQueued: () => () => {},
    sleep: async () => {},
    now: () => "now",
  }
  return { calls, deps, channel }
}
const ctx = { teamId: "t", sessionId: "s", profileId: "p" }
const noEvents = { onRemote: () => {}, onDrop: () => {} }
const drained = async () => ({ sent: [], parked: [], stopped: "empty" as const })

describe("sync cycle (g4, reconnect order)", () => {
  it("is push -> pull -> resubscribe, and never the other way round (05 §2.5)", async () => {
    const h = harness(drained)
    const r = await runSyncCycle(h.deps, ctx, new AbortController().signal, noEvents)
    expect(r).toEqual({ ok: true, channel: h.channel })
    expect(h.calls).toEqual(["bootstrap", "push", "pullMeta", "pull", "resubscribe"])
  })

  it("RULE-13: while the push cannot finish (server down) nothing is pulled and nothing is subscribed", async () => {
    const h = harness(async () => ({ sent: [], parked: [], stopped: "transient" as const, retryInMs: 1500 }))
    const r = await runSyncCycle(h.deps, ctx, new AbortController().signal, noEvents)
    expect(r).toMatchObject({ ok: false, retryInMs: 1500 })
    expect(h.calls).toEqual(["bootstrap", "push"])
  })

  it("a cancelled cycle (offline, another workspace) stops before it pulls", async () => {
    const ac = new AbortController()
    const h = harness(async () => (ac.abort(), { sent: [], parked: [], stopped: "aborted" as const }))
    const r = await runSyncCycle(h.deps, ctx, ac.signal, noEvents)
    expect(r.ok).toBe(false)
    expect(h.calls).toEqual(["bootstrap", "push"])
  })

  it("g7: a confirmed write to a non-mirrored table refreshes meta again, after the confirmation", async () => {
    const h = harness(async () => ({ sent: [{ seq: 1, rowId: "r", table: "team_personas", op: "update", payload: {}, state: "queued", attempts: 0 }], parked: [], stopped: "empty" as const }))
    await runSyncCycle(h.deps, ctx, new AbortController().signal, noEvents)
    expect(h.calls).toEqual(["bootstrap", "push", "pullMeta", "pullMeta", "pull", "resubscribe"])
  })

  it("an error anywhere becomes a retryable result, not a throw", async () => {
    const h = harness(drained)
    h.deps.reconcile = async () => {
      throw new Error("boom")
    }
    expect(await runSyncCycle(h.deps, ctx, new AbortController().signal, noEvents)).toMatchObject({ ok: false, error: "boom" })
  })
})
