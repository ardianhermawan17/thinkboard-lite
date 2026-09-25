import { describe, expect, it } from "vitest"
import { stripUi } from "@shared/config/redux/persist"
import { initialSyncState, manualOfflineSet, networkDownSet, phaseChanged, syncReducer } from "./sync-slice"

describe("sync slice mode switch (g1)", () => {
  it("manual Work offline is authoritative and drives the phase", () => {
    const off = syncReducer(initialSyncState, manualOfflineSet(true))
    expect(off).toMatchObject({ manualOffline: true, phase: "offline" })
    const on = syncReducer(off, manualOfflineSet(false))
    expect(on).toMatchObject({ manualOffline: false, phase: "collaboration" })
  })

  it("auto-detect may only degrade: coming back online records it but never resumes", () => {
    const down = syncReducer(initialSyncState, networkDownSet(true))
    expect(down.phase).toBe("offline")
    expect(down.ui.networkDown).toBe(true)

    const back = syncReducer(down, networkDownSet(false))
    expect(back.ui.networkDown).toBe(false)
    expect(back.phase).toBe("offline") // the banner's button resumes, never the browser (spec §5.3)
  })

  it("a browser online event never clears a manual choice", () => {
    const flap = syncReducer(syncReducer(initialSyncState, manualOfflineSet(true)), networkDownSet(false))
    expect(flap.manualOffline).toBe(true)
    expect(flap.phase).toBe("offline")
  })

  it("phaseChanged still drives the reconnect sequence", () => {
    expect(syncReducer(initialSyncState, phaseChanged("offline")).phase).toBe("offline")
  })

  it("manualOffline persists; networkDown is stripped (I16)", () => {
    const state = syncReducer(syncReducer(initialSyncState, manualOfflineSet(true)), networkDownSet(true))
    const persisted = stripUi.in(state as never, "sync", {}) as Record<string, unknown>
    expect(persisted.manualOffline).toBe(true)
    expect("ui" in persisted).toBe(false)
  })
})
