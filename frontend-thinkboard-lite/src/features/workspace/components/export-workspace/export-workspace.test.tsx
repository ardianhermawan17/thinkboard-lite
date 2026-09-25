import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ exportWorkspace: vi.fn(), state: {} as Record<string, unknown> }))
vi.mock("./use-export-workspace", () => ({ useExportWorkspace: () => mocks.state }))

import { ExportWorkspace } from "./export-workspace"

afterEach(cleanup)

describe("ExportWorkspace (g4)", () => {
  it("disables the control with a reason when there is nothing to export", () => {
    mocks.state = { canExport: false, busy: false, error: null, exportWorkspace: mocks.exportWorkspace }
    render(<ExportWorkspace />)
    const button = screen.getByRole("button", { name: "Export" }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.title).toMatch(/document to export/i)
  })

  it("triggers the export and shows the busy label", () => {
    mocks.state = { canExport: true, busy: false, error: null, exportWorkspace: mocks.exportWorkspace }
    const { rerender } = render(<ExportWorkspace />)
    fireEvent.click(screen.getByRole("button", { name: "Export" }))
    expect(mocks.exportWorkspace).toHaveBeenCalledTimes(1)

    mocks.state = { canExport: true, busy: true, error: null, exportWorkspace: mocks.exportWorkspace }
    rerender(<ExportWorkspace />)
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole("button").textContent).toContain("Exporting")
  })
})
