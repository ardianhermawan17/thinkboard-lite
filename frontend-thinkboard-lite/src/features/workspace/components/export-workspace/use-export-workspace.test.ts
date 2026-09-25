import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  context: { profileId: "p1", sessionId: "s1" } as { profileId: string | null; sessionId: string | null },
  artifacts: [] as unknown[],
  highlights: [] as unknown[],
  notes: [] as unknown[],
  meta: { title: "Workspace A", initial_question: "Why?" } as Record<string, unknown> | undefined,
  loadArtifactBytes: vi.fn(async () => ({ bytes: new Uint8Array([1]) })),
  appendHighlightsToPdf: vi.fn(async (bytes: Uint8Array) => bytes),
  buildBundleZip: vi.fn(async (..._args: unknown[]) => new Uint8Array([9, 9])),
  downloadBytes: vi.fn(),
}))
vi.mock("@shared/providers/workspace-provider", () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock("@feature/entities", () => ({
  META: { session: "session" },
  useArtifactsForSession: () => mocks.artifacts,
  useHighlightsForSession: () => mocks.highlights,
  useNotesForSession: () => mocks.notes,
  useMeta: () => (mocks.meta ? { value: mocks.meta } : undefined),
}))
vi.mock("@shared/lib/pdf", () => ({ loadArtifactBytes: mocks.loadArtifactBytes }))
vi.mock("@shared/lib/bundle", () => ({ appendHighlightsToPdf: mocks.appendHighlightsToPdf, buildBundleZip: mocks.buildBundleZip, bundleFilename: () => "workspace-a-20260926.zip" }))
vi.mock("@shared/lib/download", () => ({ downloadBytes: mocks.downloadBytes }))

import { useExportWorkspace } from "./use-export-workspace"

const ARTIFACT = { id: "a1", kind: "pdf", storagePath: "artifacts/s1/a1.pdf", pageCount: 3 }
const HIGHLIGHT = { id: "h1", slug: "h-p01-01-aaaaaa", page: 1, bbox: { page: 1, rects: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.05 }], color: null, tool: "text_layer" }, text: "Cost basis", layer: "individual", extraction: "text_layer", confidence: 1, weight: 1 }
const NOTE = { id: "n1", highlightId: "h1", content: "my note", inputMode: "keyboard", visibility: "individual" }

beforeEach(() => {
  mocks.artifacts = [ARTIFACT]
  mocks.highlights = [HIGHLIGHT]
  mocks.notes = [NOTE]
  mocks.context = { profileId: "p1", sessionId: "s1" }
})
afterEach(() => vi.clearAllMocks())

describe("useExportWorkspace (g2)", () => {
  it("maps the session's rows and the PDF bytes, appends, zips and downloads", async () => {
    const { result } = renderHook(() => useExportWorkspace())
    expect(result.current.canExport).toBe(true)
    await act(async () => {
      await result.current.exportWorkspace()
    })

    expect(mocks.loadArtifactBytes).toHaveBeenCalledWith("p1", ARTIFACT.storagePath)
    expect(mocks.appendHighlightsToPdf).toHaveBeenCalledTimes(1)
    const input = mocks.buildBundleZip.mock.calls[0][0] as { sessionId: string; title: string | null; highlights: unknown[]; notes: unknown[] }
    expect(input.sessionId).toBe("s1")
    expect(input.title).toBe("Workspace A")
    expect(input.highlights).toHaveLength(1)
    expect(input.notes).toEqual([{ id: "n1", highlightId: "h1", content: "my note", inputMode: "keyboard", visibility: "individual" }])
    expect(mocks.downloadBytes).toHaveBeenCalledWith(new Uint8Array([9, 9]), "workspace-a-20260926.zip")
    expect(result.current.error).toBeNull()
  })

  it("skips a highlight with no slug (it cannot be anchored) and still exports", async () => {
    mocks.highlights = [{ ...HIGHLIGHT, slug: null }]
    const { result } = renderHook(() => useExportWorkspace())
    await act(async () => {
      await result.current.exportWorkspace()
    })
    expect(mocks.appendHighlightsToPdf).not.toHaveBeenCalled() // nothing to annotate
    const input = mocks.buildBundleZip.mock.calls[0][0] as { highlights: unknown[] }
    expect(input.highlights).toHaveLength(0)
    expect(mocks.downloadBytes).toHaveBeenCalled()
  })

  it("reports why there is nothing to export and does no work", async () => {
    mocks.artifacts = []
    const { result } = renderHook(() => useExportWorkspace())
    expect(result.current.canExport).toBe(false)
    await act(async () => {
      await result.current.exportWorkspace()
    })
    expect(result.current.error).toMatch(/no document/i)
    expect(mocks.loadArtifactBytes).not.toHaveBeenCalled()
    expect(mocks.downloadBytes).not.toHaveBeenCalled()
  })
})
