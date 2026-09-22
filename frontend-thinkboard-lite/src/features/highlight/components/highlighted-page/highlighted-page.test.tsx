import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@shared/components/canvas/page-stage", () => ({
  PageStage: (props: { children?: React.ReactNode; pageNumber: number }) => (
    <div data-testid="page-stage" data-page={props.pageNumber}>
      {props.children}
    </div>
  ),
}))
vi.mock("@shared/components/canvas/highlight-layer", () => ({
  HighlightLayer: (props: { highlights: { id: string }[] }) => <div data-testid="highlight-layer" data-count={props.highlights.length} />,
}))
vi.mock("../text-highlight-capture", () => ({ TextHighlightCapture: () => <div data-testid="capture" /> }))

const useHighlightsForPage = vi.fn<(a: unknown, p: unknown) => unknown[]>(() => [{ id: "h1", bbox: { page: 3, rects: [{ x: 0.1, y: 0.1, w: 0.1, h: 0.02 }], color: null, tool: "text_layer" } }])
vi.mock("@feature/entities/queries/use-highlights-for-page", () => ({ useHighlightsForPage: (a: unknown, p: unknown) => useHighlightsForPage(a, p) }))

import { HighlightedPage } from "./highlighted-page"

describe("HighlightedPage (g4, integration)", () => {
  it("mounts page-stage with highlight-layer inside it, hands through the stored highlights", () => {
    render(<HighlightedPage doc={{} as never} artifactId={"a1" as never} profileId="p1" pageNumber={3} zoom={1} rotation={0} onZoomCommit={vi.fn()} />)
    const stage = screen.getByTestId("page-stage")
    expect(stage.dataset.page).toBe("3")
    expect(screen.getByTestId("highlight-layer").dataset.count).toBe("1")
  })

  it("does not mount the capture container until page-stage reports a rendered text layer", () => {
    render(<HighlightedPage doc={{} as never} artifactId={"a1" as never} profileId="p1" pageNumber={3} zoom={1} rotation={0} onZoomCommit={vi.fn()} />)
    expect(screen.queryByTestId("capture")).toBeNull()
  })
})
