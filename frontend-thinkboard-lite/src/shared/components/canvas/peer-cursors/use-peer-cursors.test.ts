import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const paintCursors = vi.fn(() => vi.fn())
vi.mock("./peer-cursors.painter", () => ({ paintCursors: (...a: unknown[]) => paintCursors(...(a as [])) }))

import { usePeerCursors } from "./use-peer-cursors"

afterEach(() => vi.clearAllMocks())

describe("usePeerCursors (g2, RULE-20)", () => {
  it("hands the paint function to register and replaces the previous paint each call", () => {
    const register = vi.fn()
    const { result } = renderHook(() => usePeerCursors({ register }))
    Object.defineProperty(result.current.layerRef, "current", { value: {}, writable: true })

    expect(register).toHaveBeenCalledTimes(1)
    const paint = register.mock.calls[0][0] as (cursors: { id: string; x: number; y: number }[]) => void

    const first = vi.fn()
    const second = vi.fn()
    paintCursors.mockReturnValueOnce(first).mockReturnValueOnce(second)
    paint([{ id: "p1", x: 1, y: 1 }])
    paint([{ id: "p2", x: 2, y: 2 }])

    expect(paintCursors).toHaveBeenCalledTimes(2)
    expect(first).toHaveBeenCalledTimes(1) // the first paint was disposed before the second
    expect(second).not.toHaveBeenCalled()
  })
})
