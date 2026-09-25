import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("./use-page-stage", () => ({
  usePageStage: () => ({
    canvasRef: { current: null },
    textLayerRef: { current: null },
    gestureRef: { current: null },
    pageSize: { width: 0, height: 0 },
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
  }),
}))

import { PageStage } from "./page-stage"
import type { PdfDocument } from "@shared/lib/pdf"

const doc = {} as PdfDocument

afterEach(cleanup)

describe("PageStage interactive (g3/I27)", () => {
  it("is pointer-events-none when interactive=false, so a note sheet open above it swallows no pen input", () => {
    render(<PageStage doc={doc} pageNumber={1} zoom={1} rotation={0} interactive={false} />)
    const stage = screen.getByTestId("page-stage")
    expect(stage.getAttribute("data-interactive")).toBe("false")
    expect(stage.className).toContain("pointer-events-none")
  })

  it("stays interactive by default", () => {
    render(<PageStage doc={doc} pageNumber={1} zoom={1} rotation={0} />)
    const stage = screen.getByTestId("page-stage")
    expect(stage.getAttribute("data-interactive")).toBe("true")
    expect(stage.className).not.toContain("pointer-events-none")
  })

  it("g2: touch-action is none only while a draw tool is active, so a disarmed page can still pan/scroll", () => {
    const { rerender } = render(<PageStage doc={doc} pageNumber={1} zoom={1} rotation={0} />)
    let stage = screen.getByTestId("page-stage")
    expect(stage.dataset.drawing).toBe("false")
    expect(stage.className).toContain("touch-pan-x")
    expect(stage.className).not.toContain("touch-none")

    rerender(<PageStage doc={doc} pageNumber={1} zoom={1} rotation={0} drawing />)
    stage = screen.getByTestId("page-stage")
    expect(stage.dataset.drawing).toBe("true")
    expect(stage.className).toContain("touch-none")
    expect(stage.className).not.toContain("touch-pan-x")
  })
})
