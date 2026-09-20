import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useBreakpoint } from "./use-breakpoint"

const listeners = new Set<() => void>()

// A matchMedia whose answers follow `width`; changing the width notifies the subscribers like a real resize.
function setWidth(width: number) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: width >= Number(/min-width:\s*(\d+)px/.exec(query)?.[1]),
    media: query,
    addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
  })) as never
}

afterEach(() => listeners.clear())

describe("useBreakpoint (g4, 03 §7 / D-11)", () => {
  it.each([
    [390, "mobile"],
    [767, "mobile"],
    [768, "tablet"],
    [1279, "tablet"],
    [1280, "desktop"],
    [1920, "desktop"],
  ])("%ipx is %s", (width, expected) => {
    setWidth(width)
    expect(renderHook(() => useBreakpoint()).result.current).toBe(expected)
  })

  it("follows a resize without a reload", () => {
    setWidth(1400)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe("desktop")
    act(() => {
      setWidth(800)
      listeners.forEach((notify) => notify())
    })
    expect(result.current).toBe("tablet")
  })

  it("stops listening when the component unmounts", () => {
    setWidth(800)
    const { unmount } = renderHook(() => useBreakpoint())
    expect(listeners.size).toBeGreaterThan(0)
    unmount()
    expect(listeners.size).toBe(0)
  })
})
