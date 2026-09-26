import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  context: { profileId: "p1" as string | null, sessionId: "s1" as string | null },
  artifacts: [] as unknown[],
  loadArtifactBytes: vi.fn(async () => ({ bytes: new Uint8Array([1]) })),
  openPdf: vi.fn(),
  pageImageData: vi.fn(async () => null as unknown),
}))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock("@feature/entities/queries/use-artifacts-for-session", () => ({ useArtifactsForSession: () => mocks.artifacts }))
vi.mock("@shared/lib/pdf", () => ({ loadArtifactBytes: mocks.loadArtifactBytes, openPdf: mocks.openPdf, pageImageData: mocks.pageImageData }))

import { useImportSource } from "./use-import-source"

const ARTIFACT = { id: "a1", kind: "pdf", storagePath: "artifacts/s1/a1.pdf" }

function fakePage(pageNumber: number) {
  return {
    getAnnotations: async () => (pageNumber === 1 ? [{ subtype: "Highlight", quadPoints: [10, 180, 40, 180, 10, 170, 40, 170] }] : []),
    getViewport: () => ({
      width: 100,
      height: 200,
      transform: [1, 0, 0, -1, 0, 200],
      // pdfjs v6: the hook calls convertToViewportPoint (Y flips for a top-down viewport).
      convertToViewportPoint: (x: number, y: number) => [x, 200 - y],
    }),
    getTextContent: async () => ({ items: [{ str: "Cost", transform: [1, 0, 0, 1, 10, 170], width: 20, height: 10 }] }),
  }
}
const emptyPage = {
  getAnnotations: async () => [],
  getViewport: () => ({ width: 100, height: 200, transform: [1, 0, 0, -1, 0, 200], convertToViewportPoint: (x: number, y: number) => [x, 200 - y] }),
  getTextContent: async () => ({ items: [] }),
}

beforeEach(() => {
  mocks.context = { profileId: "p1", sessionId: "s1" }
  mocks.artifacts = [ARTIFACT]
  mocks.pageImageData.mockResolvedValue(null)
  mocks.openPdf.mockResolvedValue({ numPages: 2, getPage: vi.fn(async (n: number) => fakePage(n)) })
})
afterEach(() => vi.clearAllMocks())

function yellowRaster(width: number, height: number, box: { x: number; y: number; w: number; h: number }) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const on = x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h
      const o = (y * width + x) * 4
      data[o] = on ? 255 : 255
      data[o + 1] = on ? 255 : 255
      data[o + 2] = on ? 0 : 255
      data[o + 3] = 255
    }
  }
  return { data, width, height }
}

describe("useImportSource (g3)", () => {
  it("scans every page and returns rung-1 candidates with their OWN page", async () => {
    const { result } = renderHook(() => useImportSource())
    expect(result.current.canScan).toBe(true)
    await act(async () => {
      await result.current.scan()
    })
    expect(mocks.loadArtifactBytes).toHaveBeenCalledWith("p1", ARTIFACT.storagePath)
    expect(result.current.candidates).toHaveLength(1)
    expect(result.current.candidates[0]).toMatchObject({ page: 1, extraction: "text_layer", text: "Cost" })
  })

  it("reports why there is nothing to scan and does no work", async () => {
    mocks.artifacts = []
    const { result } = renderHook(() => useImportSource())
    expect(result.current.canScan).toBe(false)
    await act(async () => {
      await result.current.scan()
    })
    expect(result.current.error).toMatch(/no document/i)
    expect(mocks.loadArtifactBytes).not.toHaveBeenCalled()
  })

  it("reports a document with no highlights", async () => {
    mocks.openPdf.mockResolvedValue({ numPages: 1, getPage: vi.fn(async () => emptyPage) })
    const { result } = renderHook(() => useImportSource())
    await act(async () => {
      await result.current.scan()
    })
    expect(result.current.candidates).toHaveLength(0)
    expect(result.current.error).toMatch(/no highlights/i)
  })

  it("rung 2: a page with no annotations falls back to its flattened ink", async () => {
    const flattened = {
      getAnnotations: async () => [],
      getViewport: () => ({ width: 100, height: 200, transform: [1, 0, 0, -1, 0, 200], convertToViewportPoint: (x: number, y: number) => [x, 200 - y] }),
      getTextContent: async () => ({ items: [{ str: "Flattened", transform: [1, 0, 0, 1, 10, 175], width: 40, height: 10 }] }),
    }
    mocks.openPdf.mockResolvedValue({ numPages: 1, getPage: vi.fn(async () => flattened) })
    mocks.pageImageData.mockResolvedValue(yellowRaster(100, 200, { x: 10, y: 18, w: 60, h: 12 }))

    const { result } = renderHook(() => useImportSource())
    await act(async () => {
      await result.current.scan()
    })
    expect(mocks.pageImageData).toHaveBeenCalledTimes(1)
    expect(result.current.candidates).toHaveLength(1)
    expect(result.current.candidates[0]).toMatchObject({ page: 1, extraction: "text_layer", text: "Flattened" })
  })

  it("rung 1 short-circuits: an annotated page never pays for a raster", async () => {
    mocks.openPdf.mockResolvedValue({ numPages: 1, getPage: vi.fn(async () => fakePage(1)) })
    const { result } = renderHook(() => useImportSource())
    await act(async () => {
      await result.current.scan()
    })
    expect(result.current.candidates).toHaveLength(1)
    expect(mocks.pageImageData).not.toHaveBeenCalled()
  })
})
