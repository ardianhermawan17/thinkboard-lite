import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@feature/document/components/document-viewer", () => ({
  DocumentViewer: (props: { sessionId: string; renderPage?: (args: Record<string, unknown>) => unknown }) => (
    <div data-testid="document-viewer" data-session={props.sessionId}>
      {props.renderPage?.({ doc: {}, artifactId: "a1", profileId: "p1", pageNumber: 3, zoom: 1, rotation: 0, onZoomCommit: () => {} }) as never}
    </div>
  ),
}))
vi.mock("@feature/highlight/components/highlighted-page", () => ({
  HighlightedPage: (props: { pageNumber: number; tool: unknown }) => <div data-testid="highlighted-page" data-page={props.pageNumber} data-tool={String(props.tool)} />,
}))
// 026/028: the note panel and presence rail read the shared workspace context, which this unit test does not provide.
vi.mock("@feature/notes/components/note-panel", () => ({ NotePanel: () => <div data-testid="note-panel" /> }))
vi.mock("@feature/presence/components/presence-rail", () => ({ PresenceRail: () => <div data-testid="presence-rail" /> }))

import { WorkspaceDocument } from "./workspace-document"

afterEach(cleanup)

describe("WorkspaceDocument (g1-g4)", () => {
  it("composes DocumentViewer with HighlightedPage through renderPage, at the session id it was given", () => {
    render(<WorkspaceDocument sessionId="s1" />)
    expect(screen.getByTestId("document-viewer").dataset.session).toBe("s1")
    expect(screen.getByTestId("highlighted-page").dataset.page).toBe("3")
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("null")
  })

  it("arms the marquee with the chosen region tool and disarms it again", () => {
    render(<WorkspaceDocument sessionId="s1" />)
    fireEvent.click(screen.getByRole("button", { name: "Rectangle" }))
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("rect")
    fireEvent.click(screen.getByRole("button", { name: "Freehand" }))
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("freehand")
    fireEvent.click(screen.getByRole("button", { name: "Select" }))
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("null")
  })
})
