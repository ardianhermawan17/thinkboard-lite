import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
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
// 026: the note panel reads the shared workspace context, which this unit test does not provide.
vi.mock("@feature/notes/components/note-panel", () => ({ NotePanel: () => <div data-testid="note-panel" /> }))
// 032: the import source reads the shared context too.
vi.mock("@feature/highlight/components/import-source", () => ({ ImportSource: () => <div data-testid="import-source" /> }))
// 028/031: presence reads the shared context too; mock the whole barrel so the provider adds nothing here.
vi.mock("@feature/presence", () => ({
  PresenceProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  usePresenceContext: () => ({ peers: [], leaderDrawing: false, leaderId: null, publishCursor: vi.fn(), subscribe: vi.fn(() => () => {}) }),
  PresenceLayer: () => null,
  PresenceRail: () => <div data-testid="presence-rail" />,
}))
// 041: the first-run tour reads the store, which this composition test does not provide.
vi.mock("@feature/workspace/components/onboarding-tour", () => ({ OnboardingTour: () => <div data-testid="onboarding-tour" /> }))

import { WorkspaceProvider, useWorkspaceContext } from "@shared/providers/workspace-provider"
import { WorkspaceDocument } from "./workspace-document"

afterEach(cleanup)

/** 043: the rails are provider state, so the test flips them the way a header toggle would. */
function HideRails() {
  const { setNotesVisible } = useWorkspaceContext()
  return (
    <button type="button" onClick={() => setNotesVisible(false)}>
      hide rails
    </button>
  )
}

const renderRoute = () =>
  render(
    <WorkspaceProvider profileId="p1" sessionId="s1">
      <WorkspaceDocument sessionId="s1" />
      <HideRails />
    </WorkspaceProvider>
  )

describe("WorkspaceDocument (g1-g4)", () => {
  it("composes DocumentViewer with HighlightedPage through renderPage, at the session id it was given", () => {
    renderRoute()
    expect(screen.getByTestId("document-viewer").dataset.session).toBe("s1")
    expect(screen.getByTestId("highlighted-page").dataset.page).toBe("3")
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("null")
  })

  it("arms the marquee with the chosen region tool and disarms it again", () => {
    renderRoute()
    fireEvent.click(screen.getByRole("button", { name: "Rectangle" }))
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("rect")
    fireEvent.click(screen.getByRole("button", { name: "Freehand" }))
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("freehand")
    fireEvent.click(screen.getByRole("button", { name: "Select" }))
    expect(screen.getByTestId("highlighted-page").dataset.tool).toBe("null")
  })

  it("043: shows the notes rail, folds it to a chevron handle, and comes back", () => {
    renderRoute()
    expect(screen.getByTestId("notes-rail")).toBeTruthy()
    expect(screen.getByTestId("note-panel")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "hide rails" }))

    expect(screen.queryByTestId("notes-rail")).toBeNull()
    expect(screen.queryByTestId("note-panel")).toBeNull()
    expect(screen.queryByTestId("import-source")).toBeNull()
    // the page itself stays, and the way back sits where the rail was
    expect(screen.getByTestId("document-viewer")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Show the notes rail" }))
    expect(screen.getByTestId("notes-rail")).toBeTruthy()
    expect(screen.getByTestId("note-panel")).toBeTruthy()
  })
})
