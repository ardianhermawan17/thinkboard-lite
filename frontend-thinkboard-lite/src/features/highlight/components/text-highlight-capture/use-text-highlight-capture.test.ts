import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const insertHighlight = vi.fn()
vi.mock("@feature/entities/repository/highlight-repository", () => ({ insertHighlight: (...a: unknown[]) => insertHighlight(...a) }))

const useHighlightsForPage = vi.fn<(a: unknown, p: unknown) => unknown[]>(() => [])
vi.mock("@feature/entities/queries/use-highlights-for-page", () => ({ useHighlightsForPage: (a: unknown, p: unknown) => useHighlightsForPage(a, p) }))

import { useTextHighlightCapture } from "./use-text-highlight-capture"

const PROPS = {
  artifactId: "artifact-1" as never,
  profileId: "profile-1" as never,
  page: 3,
  textLayerSize: { width: 600, height: 800 },
  rotation: 0 as const,
}

function fakeRect(x: number, y: number, w: number, h: number): DOMRect {
  return { x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }
}

function mockSelection(container: HTMLElement, opts: { collapsed?: boolean; text?: string; rects?: DOMRect[] } = {}) {
  const { collapsed = false, text = "Cost basis is stated in 2023 prices", rects = [fakeRect(60, 200, 480, 20)] } = opts
  const range = document.createRange()
  Object.defineProperty(range, "getClientRects", { value: () => rects })
  const selection = {
    isCollapsed: collapsed,
    rangeCount: 1,
    anchorNode: container,
    toString: () => text,
    getRangeAt: () => range,
    removeAllRanges: vi.fn(),
  } as unknown as Selection
  vi.spyOn(window, "getSelection").mockReturnValue(selection)
  return selection
}

beforeEach(() => {
  insertHighlight.mockClear()
  useHighlightsForPage.mockReturnValue([])
})
afterEach(() => vi.restoreAllMocks())

describe("useTextHighlightCapture (g1, g3)", () => {
  it("writes a highlight on selection end (pointerup) inside the text layer", async () => {
    const container = document.createElement("div")
    Object.defineProperty(container, "getBoundingClientRect", { value: () => fakeRect(0, 0, 600, 800) })
    mockSelection(container)

    renderHook(() => useTextHighlightCapture({ ...PROPS, textLayerElement: container }))
    document.dispatchEvent(new Event("pointerup"))
    await vi.waitFor(() => expect(insertHighlight).toHaveBeenCalledTimes(1))

    const call = insertHighlight.mock.calls[0][0]
    expect(call.text).toBe("Cost basis is stated in 2023 prices")
    expect(call.extraction).toBeUndefined() // repository defaults it to 'text_layer' itself
    expect(call.confidence).toBe(1.0)
    expect(call.page).toBe(3)
    expect(typeof call.slug).toBe("string")
    expect(call.slug).toMatch(/^h-p03-/)
    expect(call.bbox.rects).toHaveLength(1)
  })

  it("does nothing for a collapsed selection", async () => {
    const container = document.createElement("div")
    Object.defineProperty(container, "getBoundingClientRect", { value: () => fakeRect(0, 0, 600, 800) })
    mockSelection(container, { collapsed: true })

    renderHook(() => useTextHighlightCapture({ ...PROPS, textLayerElement: container }))
    document.dispatchEvent(new Event("pointerup"))
    await new Promise((r) => setTimeout(r, 0))
    expect(insertHighlight).not.toHaveBeenCalled()
  })

  it("ignores a selection outside this page's text layer", async () => {
    const thisPage = document.createElement("div")
    Object.defineProperty(thisPage, "getBoundingClientRect", { value: () => fakeRect(0, 0, 600, 800) })
    const otherPage = document.createElement("div")
    mockSelection(otherPage)

    renderHook(() => useTextHighlightCapture({ ...PROPS, textLayerElement: thisPage }))
    document.dispatchEvent(new Event("pointerup"))
    await new Promise((r) => setTimeout(r, 0))
    expect(insertHighlight).not.toHaveBeenCalled()
  })

  it("does nothing when the selection collapses to no text", async () => {
    const container = document.createElement("div")
    Object.defineProperty(container, "getBoundingClientRect", { value: () => fakeRect(0, 0, 600, 800) })
    mockSelection(container, { text: "   " })

    renderHook(() => useTextHighlightCapture({ ...PROPS, textLayerElement: container }))
    document.dispatchEvent(new Event("pointerup"))
    await new Promise((r) => setTimeout(r, 0))
    expect(insertHighlight).not.toHaveBeenCalled()
  })

  it("computes reading order from existing highlights on the page, not insertion order", async () => {
    const container = document.createElement("div")
    Object.defineProperty(container, "getBoundingClientRect", { value: () => fakeRect(0, 0, 600, 800) })
    mockSelection(container)
    useHighlightsForPage.mockReturnValue([
      { bbox: { rects: [{ x: 0.05, y: 0.05, w: 0.1, h: 0.02 }] } },
      { bbox: { rects: [{ x: 0.05, y: 0.15, w: 0.1, h: 0.02 }] } },
    ])

    renderHook(() => useTextHighlightCapture({ ...PROPS, textLayerElement: container }))
    document.dispatchEvent(new Event("pointerup"))
    await vi.waitFor(() => expect(insertHighlight).toHaveBeenCalledTimes(1))
    // the new selection is at y=0.25 (200/800), below both existing highlights -> rank 3
    expect(insertHighlight.mock.calls[0][0].slug).toMatch(/^h-p03-03-/)
  })
})
