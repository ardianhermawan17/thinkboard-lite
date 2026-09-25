import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getMeta = vi.fn()
const putMeta = vi.fn()
vi.mock("@feature/entities/repository/meta-repository", () => ({
  getMeta: (...a: unknown[]) => getMeta(...a),
  putMeta: (...a: unknown[]) => putMeta(...a),
}))

import { useWritingCheck } from "./use-writing-check"

beforeEach(() => {
  getMeta.mockReset().mockResolvedValue(undefined)
  putMeta.mockReset().mockResolvedValue(undefined)
})

describe("useWritingCheck", () => {
  it("g4: reads meta.handwriting once, so a device that already ran the check does not see it again", async () => {
    getMeta.mockResolvedValue({ os: "iPadOS", unavailable: false })
    const { result } = renderHook(() => useWritingCheck())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.checked).toEqual({ os: "iPadOS", unavailable: false })
  })

  it("records unavailable: true when no pen was ever seen", async () => {
    const { result } = renderHook(() => useWritingCheck())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.complete()
    })

    expect(putMeta).toHaveBeenCalledWith("handwriting", expect.objectContaining({ unavailable: true }))
  })

  it("records unavailable: false once a pen pointerdown was seen", async () => {
    const { result } = renderHook(() => useWritingCheck())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "pen" }))
    })

    await act(async () => {
      await result.current.complete()
    })

    expect(putMeta).toHaveBeenCalledWith("handwriting", expect.objectContaining({ unavailable: false }))
  })
})
