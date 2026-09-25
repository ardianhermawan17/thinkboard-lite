import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@feature/entities/repository/note-repository", () => ({
  insertNote: vi.fn().mockResolvedValue({ id: "note-1" }),
  updateNote: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@feature/entities/repository/meta-repository", () => ({
  getMeta: vi.fn().mockResolvedValue({ os: "test", unavailable: false }),
  putMeta: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@shared/components/canvas/page-stage/use-page-stage", () => ({
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

import { PageStage } from "@shared/components/canvas/page-stage"
import type { PdfDocument } from "@shared/lib/pdf"
import { NoteSheet } from "./note-sheet"

const doc = {} as PdfDocument

afterEach(cleanup)

describe("NoteSheet + PageStage composition (g3, I27)", () => {
  it("disables the Stage's pointer events while the sheet is open, and the sheet content has an opaque background in its own portal", () => {
    render(
      <>
        <PageStage doc={doc} pageNumber={1} zoom={1} rotation={0} interactive={false} />
        <NoteSheet highlightId={"highlight-1" as never} profileId={"profile-1" as never} note={undefined} open onOpenChange={vi.fn()} />
      </>
    )

    expect(screen.getByTestId("page-stage").className).toContain("pointer-events-none")

    const title = screen.getByText("Note")
    const sheetContent = title.closest('[data-slot="sheet-content"]')
    expect(sheetContent).not.toBeNull()
    expect(sheetContent?.className).toContain("bg-popover")
    // Radix portals SheetContent to document.body, outside the page-stage subtree — a real, separate stacking context.
    expect(screen.getByTestId("page-stage").contains(sheetContent)).toBe(false)
  })
})
