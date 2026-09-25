import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ setOpen: vi.fn(), setMarkdown: vi.fn(), apply: vi.fn(), state: {} as Record<string, unknown> }))
vi.mock("./use-reimport-review", () => ({ useReimportReview: () => mocks.state }))

import { ReimportReview } from "./reimport-review"

afterEach(cleanup)

describe("ReimportReview (g3)", () => {
  it("toggles the paste panel", () => {
    mocks.state = { open: false, setOpen: mocks.setOpen, markdown: "", setMarkdown: mocks.setMarkdown, plan: null, applied: null, busy: false, error: null, apply: mocks.apply }
    render(<ReimportReview />)
    fireEvent.click(screen.getByRole("button", { name: "Re-import notes" }))
    expect(mocks.setOpen).toHaveBeenCalledWith(true)
  })

  it("shows the counts and applies the matched notes", () => {
    mocks.state = { open: true, setOpen: mocks.setOpen, markdown: "md", setMarkdown: mocks.setMarkdown, plan: { matched: 2, unanchored: 1, orphans: 0, missing: 3 }, applied: null, busy: false, error: null, apply: mocks.apply }
    render(<ReimportReview />)
    expect(screen.getByTestId("reimport-plan").textContent).toContain("2 matched")
    fireEvent.click(screen.getByRole("button", { name: "Apply matched notes" }))
    expect(mocks.apply).toHaveBeenCalledTimes(1)
  })

  it("disables Apply when nothing matched", () => {
    mocks.state = { open: true, setOpen: mocks.setOpen, markdown: "md", setMarkdown: mocks.setMarkdown, plan: { matched: 0, unanchored: 0, orphans: 1, missing: 0 }, applied: null, busy: false, error: null, apply: mocks.apply }
    render(<ReimportReview />)
    expect((screen.getByRole("button", { name: "Apply matched notes" }) as HTMLButtonElement).disabled).toBe(true)
  })
})
