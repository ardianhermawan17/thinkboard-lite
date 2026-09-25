import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const painters = vi.hoisted(() => [] as { tool: string; pushed: { x: number; y: number }[]; disposed: number }[])

vi.mock("./marquee.painter", () => ({
  createStrokePainter: (...args: [unknown, string]) => {
    const record = { tool: args[1], pushed: [] as { x: number; y: number }[], disposed: 0 }
    painters.push(record)
    return {
      push: (p: { x: number; y: number }) => record.pushed.push(p),
      commit: () => record.pushed.slice(),
      clear: vi.fn(),
      dispose: () => {
        record.disposed += 1
      },
    }
  },
  paintStroke: vi.fn(() => vi.fn()),
}))

import { useMarquee } from "./use-marquee"
import type { MarqueePointerEvent, MarqueeProps } from "./types"

function pointerEvent(x: number, y: number, pointerType = "pen"): MarqueePointerEvent {
  return {
    evt: { pointerType, stopPropagation: vi.fn(), preventDefault: vi.fn() },
    target: { getStage: () => ({ getPointerPosition: () => ({ x, y }) }) },
    cancelBubble: false,
  } as unknown as MarqueePointerEvent
}

function mount(props: Partial<MarqueeProps> = {}) {
  const onCommit = vi.fn()
  const rendered = renderHook(() => useMarquee({ tool: "freehand", size: { w: 600, h: 800 }, rotation: 0, onCommit, ...props }))
  Object.defineProperty(rendered.result.current.layerRef, "current", { value: {}, writable: true })
  return { ...rendered, onCommit }
}

afterEach(() => {
  painters.length = 0
  vi.clearAllMocks()
})

describe("useMarquee (g1, g2)", () => {
  it("commits one normalized bounding rect from a freehand stroke and hands back copies", () => {
    const { result, onCommit } = mount({ tool: "freehand" })
    act(() => {
      result.current.onPointerDown(pointerEvent(60, 80))
      result.current.onPointerMove(pointerEvent(300, 400))
      result.current.onPointerUp(pointerEvent(300, 400))
    })
    expect(onCommit).toHaveBeenCalledTimes(1)
    const stroke = onCommit.mock.calls[0][0]
    expect(stroke.tool).toBe("freehand")
    expect(stroke.rects[0].x).toBeCloseTo(0.1)
    expect(stroke.rects[0].y).toBeCloseTo(0.1)
    expect(stroke.rects[0].w).toBeCloseTo(0.4)
    expect(stroke.rects[0].h).toBeCloseTo(0.4)
    expect(stroke.points).toHaveLength(3)
  })

  it("normalizes through the rotation, so the stored rect is page-relative (RULE-17/I19)", () => {
    const { result, onCommit } = mount({ tool: "rect", rotation: 90, size: { w: 600, h: 800 } })
    act(() => {
      result.current.onPointerDown(pointerEvent(60, 80)) // (0.1, 0.1) displayed -> (0.1, 0.9) page
      result.current.onPointerUp(pointerEvent(300, 400)) // (0.5, 0.5) displayed -> (0.5, 0.5) page
    })
    const rect = onCommit.mock.calls[0][0].rects[0]
    expect(rect.x).toBeCloseTo(0.1)
    expect(rect.y).toBeCloseTo(0.5)
    expect(rect.w).toBeCloseTo(0.4)
    expect(rect.h).toBeCloseTo(0.4)
  })

  it("ignores a tap (zero area) and a disarmed tool (g2 acceptance)", () => {
    const tap = mount({ tool: "freehand" })
    act(() => {
      tap.result.current.onPointerDown(pointerEvent(60, 80))
      tap.result.current.onPointerUp(pointerEvent(60, 80))
    })
    expect(tap.onCommit).not.toHaveBeenCalled()

    const before = painters.length
    const off = mount({ tool: null })
    act(() => {
      off.result.current.onPointerDown(pointerEvent(60, 80))
      off.result.current.onPointerMove(pointerEvent(300, 400))
      off.result.current.onPointerUp(pointerEvent(300, 400))
    })
    expect(off.onCommit).not.toHaveBeenCalled()
    expect(painters).toHaveLength(before) // a disarmed leaf never even creates a painter
  })

  it("rejects a palm (touch) once a pen has been seen, but lets the finger work before that (Q9 default)", () => {
    const { result, onCommit } = mount({ tool: "freehand" })
    act(() => {
      result.current.onPointerDown(pointerEvent(60, 80)) // touch, no pen yet -> draws
      result.current.onPointerUp(pointerEvent(300, 400, "touch"))
    })
    expect(onCommit).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.onPointerDown(pointerEvent(10, 10, "pen")) // pen seen, then released
      result.current.onPointerCancel(pointerEvent(10, 10, "pen"))
      result.current.onPointerDown(pointerEvent(20, 20, "touch")) // palm: ignored
      result.current.onPointerUp(pointerEvent(200, 200, "touch"))
    })
    expect(onCommit).toHaveBeenCalledTimes(1)
  })

  it("swallows the pointer while armed so page-stage does not pan, and clears without committing on cancel", () => {
    const { result, onCommit } = mount({ tool: "rect" })
    const down = pointerEvent(60, 80)
    act(() => result.current.onPointerDown(down))
    expect(down.evt.stopPropagation).toHaveBeenCalled()
    act(() => result.current.onPointerCancel(pointerEvent(60, 80)))
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("disposes the painter when the leaf unmounts (g1 lifecycle)", () => {
    const { result, unmount } = mount({ tool: "freehand" })
    act(() => {
      result.current.onPointerDown(pointerEvent(60, 80))
      result.current.onPointerUp(pointerEvent(300, 400))
    })
    expect(painters).toHaveLength(1)
    expect(painters[0].disposed).toBe(0)
    unmount()
    expect(painters[0].disposed).toBe(1)
  })
})
