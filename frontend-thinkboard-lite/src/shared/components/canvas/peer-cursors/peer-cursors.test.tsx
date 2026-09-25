import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("react-konva", () => ({ Layer: () => null }))

import { PeerCursors } from "./peer-cursors"

afterEach(cleanup)

describe("PeerCursors (g2)", () => {
  it("hands the paint function to register on mount", () => {
    const register = vi.fn()
    render(<PeerCursors register={register} />)
    expect(register).toHaveBeenCalledTimes(1)
    expect(typeof register.mock.calls[0][0]).toBe("function")
  })
})
