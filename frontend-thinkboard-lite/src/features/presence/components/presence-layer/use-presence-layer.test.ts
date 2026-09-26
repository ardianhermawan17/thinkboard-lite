import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ listeners: [] as ((cursors: unknown[]) => void)[], unsub: vi.fn(), subscribe: vi.fn() }))
vi.mock("../presence-provider", () => ({ usePresenceContext: () => ({ subscribe: mocks.subscribe }) }))

import { usePresenceLayer } from "./use-presence-layer"

function setup(props: Record<string, unknown> = {}) {
  mocks.listeners = []
  mocks.subscribe = vi.fn((listener: (cursors: unknown[]) => void) => {
    mocks.listeners.push(listener)
    listener([])
    return mocks.unsub
  })
  const rendered = renderHook(() => usePresenceLayer({ page: 2, size: { w: 100, h: 200 }, rotation: 0 as const, ...props } as never))
  const paint = vi.fn()
  act(() => rendered.result.current.register(paint))
  return { ...rendered, paint }
}

afterEach(() => vi.clearAllMocks())

describe("usePresenceLayer (g2)", () => {
  it("paints a cursor on this page as display pixels (the wire is page-relative 0-1)", () => {
    const { paint } = setup()
    act(() => mocks.listeners[0]([{ profileId: "p2", page: 2, x: 0.5, y: 0.5 }]))
    expect(paint).toHaveBeenLastCalledWith([{ id: "p2", x: 50, y: 100 }])
  })

  it("ignores a cursor on another page", () => {
    const { paint } = setup()
    act(() => mocks.listeners[0]([{ profileId: "p2", page: 9, x: 0.5, y: 0.5 }]))
    expect(paint).toHaveBeenLastCalledWith([])
  })

  it("clears the paint and unsubscribes on unmount", () => {
    const { paint, unmount } = setup()
    act(() => mocks.listeners[0]([{ profileId: "p2", page: 2, x: 0.5, y: 0.5 }]))
    paint.mockClear()
    unmount()
    expect(mocks.unsub).toHaveBeenCalled()
    expect(paint).toHaveBeenLastCalledWith([])
  })
})
