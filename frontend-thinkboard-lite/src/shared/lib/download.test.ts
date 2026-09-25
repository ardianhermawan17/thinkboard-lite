import { afterEach, describe, expect, it, vi } from "vitest"
import { downloadBytes } from "./download"

afterEach(() => vi.unstubAllGlobals())

describe("downloadBytes (g3)", () => {
  it("creates a blob URL, clicks the anchor and revokes the URL", () => {
    const createObjectURL = vi.fn(() => "blob:test")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const appendChild = vi.spyOn(document.body, "appendChild")

    downloadBytes(new Uint8Array([1, 2, 3]), "workspace-x-20260926.zip")

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(appendChild).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test")

    click.mockRestore()
    appendChild.mockRestore()
  })
})
