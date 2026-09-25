import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  insertHighlights: vi.fn(async (rows: unknown[]) => rows),
  useHighlightsForPage: vi.fn<() => unknown[]>(() => []),
}))
vi.mock("@feature/entities/repository/highlight-repository", () => ({ insertHighlights: mocks.insertHighlights }))
vi.mock("@feature/entities/queries/use-highlights-for-page", () => ({ useHighlightsForPage: () => mocks.useHighlightsForPage() }))

import type { ImportCandidate } from "../../utils/import-ladder"
import { useImportReview } from "./use-import-review"

const candidates: ImportCandidate[] = [
  { rects: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }], text: "A", extraction: "text_layer", confidence: 1 },
  { rects: [{ x: 0.1, y: 0.2, w: 0.2, h: 0.05 }], text: "B", extraction: "ocr", confidence: 0.4 },
]
const props = { artifactId: "a1" as never, profileId: "p1" as never, page: 3, candidates }

afterEach(() => vi.clearAllMocks())

describe("useImportReview (g4, g5)", () => {
  it("starts every region unselected and flags a below-gate region needs-correction", () => {
    const { result } = renderHook(() => useImportReview(props))
    expect(result.current.items).toHaveLength(2)
    expect(result.current.items.every((item) => !item.selected)).toBe(true)
    expect(result.current.items[1].needsCorrection).toBe(true)
    expect(result.current.selectedCount).toBe(0)
  })

  it("commits nothing that was not accepted", async () => {
    const { result } = renderHook(() => useImportReview(props))
    await act(async () => {
      await result.current.accept()
    })
    expect(mocks.insertHighlights).not.toHaveBeenCalled()
  })

  it("commits the accepted regions as group highlights in ONE call", async () => {
    const { result } = renderHook(() => useImportReview(props))
    act(() => {
      result.current.toggle("candidate-0", true)
      result.current.toggle("candidate-1", true)
    })
    let count = 0
    await act(async () => {
      count = await result.current.accept()
    })
    expect(count).toBe(2)
    expect(mocks.insertHighlights).toHaveBeenCalledTimes(1)
    const rows = mocks.insertHighlights.mock.calls[0][0] as { layer: string; extraction: string; bbox: { tool: string }; slug: string }[]
    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.layer === "group")).toBe(true)
    expect(rows.map((row) => row.extraction)).toEqual(["text_layer", "ocr"])
    expect(rows[0].bbox.tool).toBe("rect")
    expect(rows[0].slug).toMatch(/^h-p03-01-/)
  })

  it("writes the reviewer's edited text", async () => {
    const { result } = renderHook(() => useImportReview(props))
    act(() => {
      result.current.edit("candidate-0", "edited")
      result.current.toggle("candidate-0", true)
    })
    await act(async () => {
      await result.current.accept()
    })
    expect((mocks.insertHighlights.mock.calls[0][0] as { text: string }[])[0].text).toBe("edited")
  })
})
