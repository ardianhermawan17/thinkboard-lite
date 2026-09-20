import { createAction } from "@reduxjs/toolkit"
import { afterEach, describe, expect, it, vi } from "vitest"
import { listenerMiddleware, startAppListening } from "./listener"
import { persistConfig, stripUi } from "./persist"
import { makeStore } from "./store"

afterEach(() => listenerMiddleware.clearListeners())

describe("stripUi (g5)", () => {
  it("drops every slice's ui key, whatever the slice", () => {
    for (const slice of ["session", "workspace", "viewport", "sync"]) {
      const out = stripUi.in({ phase: "ready", currentId: "1", ui: { error: "boom", openSheet: "notes" } }, slice, {}) as Record<string, unknown>
      expect(out).toEqual({ phase: "ready", currentId: "1" })
      expect("ui" in out).toBe(false)
    }
  })

  it("leaves rehydration and non-object slices alone", () => {
    const slice = { phase: "idle" }
    expect(stripUi.out(slice, "x", {})).toBe(slice)
    expect(stripUi.in(null as never, "x", {})).toBeNull()
  })
})

describe("the store seam (g5, 03 §5.3)", () => {
  it("persists slices only: an empty whitelist and stripUi registered, never entities or a reducerPath (I12, I16)", () => {
    expect(persistConfig.whitelist).toEqual([])
    expect(persistConfig.transforms).toContain(stripUi)
  })

  it("builds without a warning even though no slice exists yet (the guard reducer)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    makeStore()
    expect(error).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })

  it("registers the listener middleware: a dispatched action reaches a listener", async () => {
    const ping = createAction("test/ping")
    const seen = vi.fn()
    startAppListening({ actionCreator: ping, effect: seen })
    makeStore().dispatch(ping())
    await vi.waitFor(() => expect(seen).toHaveBeenCalledTimes(1))
  })
})
