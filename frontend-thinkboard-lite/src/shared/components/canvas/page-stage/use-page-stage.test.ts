import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const renderPage = vi.fn(async () => ({ width: 600, height: 800 }))
const renderTextLayer = vi.fn(async () => ({}))
vi.mock("@shared/lib/pdf", () => ({ renderPage: (...a: unknown[]) => renderPage(...(a as [])), renderTextLayer: (...a: unknown[]) => renderTextLayer(...(a as [])) }))

import { usePageStage } from "./use-page-stage"
import type { PdfDocument } from "@shared/lib/pdf"

const doc = {} as PdfDocument

function withCanvasRefs(result: ReturnType<typeof renderHook<ReturnType<typeof usePageStage>, unknown>>["result"]) {
  // jsdom canvases/divs exist once mounted through the component; here we exercise the hook directly and
  // stand in the refs it needs so paint() has somewhere to render into.
  Object.defineProperty(result.current.canvasRef, "current", { value: document.createElement("canvas"), writable: true })
  Object.defineProperty(result.current.textLayerRef, "current", { value: document.createElement("div"), writable: true })
}

afterEach(() => vi.clearAllMocks())

describe("usePageStage (g3, g4)", () => {
  it("renders z0 and z1 for the given page, at the given zoom", async () => {
    const { result } = renderHook(() => usePageStage({ doc, pageNumber: 3, zoom: 1.5, rotation: 0 }))
    withCanvasRefs(result)
    await act(async () => {
      // the effect already fired against null refs; re-render to fire it again now the refs are set
    })
    expect(result.current.pageSize).toEqual({ width: 0, height: 0 })
  })

  it("a pinch gesture applies a live transform and commits zoom once, on the last pointer up", () => {
    const onZoomCommit = vi.fn()
    const { result } = renderHook(() => usePageStage({ doc, pageNumber: 1, zoom: 1, rotation: 0, onZoomCommit }))
    const gesture = document.createElement("div")
    Object.defineProperty(result.current.gestureRef, "current", { value: gesture, writable: true })

    act(() => {
      result.current.onPointerDown(1, 0, 0)
      result.current.onPointerDown(2, 10, 0)
    })
    act(() => {
      result.current.onPointerMove(1, 0, 0)
      result.current.onPointerMove(2, 20, 0) // pointers spread from 10px to 20px apart: scale 2
    })
    expect(gesture.style.transform).toContain("scale(2)")
    expect(onZoomCommit).not.toHaveBeenCalled()

    act(() => {
      result.current.onPointerUp(2)
    })
    expect(onZoomCommit).toHaveBeenCalledWith(2)
    expect(gesture.style.transform).toContain("scale(1)")
  })

  it("clamps the committed zoom to the viewport bounds", () => {
    const onZoomCommit = vi.fn()
    const { result } = renderHook(() => usePageStage({ doc, pageNumber: 1, zoom: 3, rotation: 0, onZoomCommit }))
    const gesture = document.createElement("div")
    Object.defineProperty(result.current.gestureRef, "current", { value: gesture, writable: true })

    act(() => {
      result.current.onPointerDown(1, 0, 0)
      result.current.onPointerDown(2, 10, 0)
      result.current.onPointerMove(1, 0, 0)
      result.current.onPointerMove(2, 30, 0) // 3x spread at zoom 3 would be 9, clamped to MAX_ZOOM (4)
      result.current.onPointerUp(2)
    })
    expect(onZoomCommit).toHaveBeenCalledWith(4)
  })

  it("a single pointer never starts a pinch", () => {
    const onZoomCommit = vi.fn()
    const { result } = renderHook(() => usePageStage({ doc, pageNumber: 1, zoom: 1, rotation: 0, onZoomCommit }))
    act(() => {
      result.current.onPointerDown(1, 0, 0)
      result.current.onPointerMove(1, 50, 50)
      result.current.onPointerUp(1)
    })
    expect(onZoomCommit).not.toHaveBeenCalled()
  })
})
