import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const insertHighlight = vi.fn(async (...input: unknown[]) => input[0])
vi.mock("@feature/entities/repository/highlight-repository", () => ({ insertHighlight: (...a: unknown[]) => insertHighlight(...(a as [])) }))

const recognizeRegion = vi.fn(async () => ({ text: "Halo dunia", confidence: 0.82 }))
vi.mock("@shared/lib/ocr", () => ({ recognizeRegion: (...a: unknown[]) => recognizeRegion(...(a as [])) }))

const highlightSlug = vi.fn(async () => "h-p03-01-abcdef")
vi.mock("@shared/lib/slug", () => ({ highlightSlug: (...a: unknown[]) => highlightSlug(...(a as [])) }))

const useHighlightsForPage = vi.fn<() => unknown[]>(() => [])
vi.mock("@feature/entities/queries/use-highlights-for-page", () => ({ useHighlightsForPage: () => useHighlightsForPage() }))

import { useRegionHighlightCapture } from "./use-region-highlight-capture"
import type { MarqueeStroke } from "@shared/components/canvas/marquee"

const STROKE: MarqueeStroke = { tool: "rect", rects: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.1 }], points: [] }

function props(overrides: Record<string, unknown> = {}) {
  return {
    artifactId: "artifact-1" as never,
    profileId: "profile-1",
    page: 3,
    tool: "rect" as const,
    size: { w: 600, h: 800 },
    rotation: 0 as const,
    canvas: document.createElement("canvas"),
    ...overrides,
  }
}

afterEach(() => vi.clearAllMocks())

describe("useRegionHighlightCapture (g3, g4)", () => {
  it("crops the region to displayed pixels, OCRs it, and writes one ocr highlight", async () => {
    const { result } = renderHook(() => useRegionHighlightCapture(props()))
    await act(async () => {
      await result.current.onCommit(STROKE)
    })
    // 0.1,0.2,0.3,0.1 of a 600x800 page -> x:60 y:160 w:180 h:80
    expect(recognizeRegion).toHaveBeenCalledTimes(1)
    const [canvasArg, cropArg] = recognizeRegion.mock.calls[0] as unknown as [HTMLCanvasElement, { x: number; y: number; w: number; h: number }]
    expect(canvasArg).toBeInstanceOf(HTMLCanvasElement)
    expect(cropArg.x).toBeCloseTo(60)
    expect(cropArg.y).toBeCloseTo(160)
    expect(cropArg.w).toBeCloseTo(180)
    expect(cropArg.h).toBeCloseTo(80)
    expect(insertHighlight).toHaveBeenCalledTimes(1)
    expect(insertHighlight.mock.calls[0][0]).toMatchObject({
      artifactId: "artifact-1",
      profileId: "profile-1",
      page: 3,
      text: "Halo dunia",
      confidence: 0.82,
      extraction: "ocr",
      slug: "h-p03-01-abcdef",
      bbox: { page: 3, rects: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.1 }], color: null, tool: "rect" },
    })
  })

  it("still writes a below-gate mark: the gate is derived, not a store-time rejection (g4)", async () => {
    recognizeRegion.mockResolvedValueOnce({ text: "weak", confidence: 0.4 })
    const { result } = renderHook(() => useRegionHighlightCapture(props()))
    await act(async () => {
      await result.current.onCommit(STROKE)
    })
    expect(insertHighlight.mock.calls[0][0]).toMatchObject({ confidence: 0.4, extraction: "ocr" })
  })

  it("does nothing before the page canvas exists or before the page has a size", async () => {
    const noCanvas = renderHook(() => useRegionHighlightCapture(props({ canvas: null })))
    await act(async () => {
      await noCanvas.result.current.onCommit(STROKE)
    })
    const noSize = renderHook(() => useRegionHighlightCapture(props({ size: { w: 0, h: 0 } })))
    await act(async () => {
      await noSize.result.current.onCommit(STROKE)
    })
    expect(recognizeRegion).not.toHaveBeenCalled()
    expect(insertHighlight).not.toHaveBeenCalled()
  })

  it("slug order counts the page's existing rects, so re-importing dedupes", async () => {
    useHighlightsForPage.mockReturnValue([{ id: "h1", bbox: { page: 3, rects: [{ x: 0.1, y: 0.05, w: 0.1, h: 0.05 }], color: null, tool: "text_layer" } }])
    const { result } = renderHook(() => useRegionHighlightCapture(props()))
    await act(async () => {
      await result.current.onCommit(STROKE)
    })
    // the existing rect sits above the region (y 0.05 < 0.2), so the region ranks second
    expect(highlightSlug).toHaveBeenCalledWith("Halo dunia", STROKE.rects[0], 3, 2)
  })
})
