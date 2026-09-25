import { describe, expect, it } from "vitest"
import { isPalm, pointerKind, shouldCapture, withPenSeen } from "./stylus"

describe("stylus pointer policy (g2, 03 §7)", () => {
  it("classifies the pointer types the spec names", () => {
    expect(pointerKind("pen")).toBe("pen")
    expect(pointerKind("touch")).toBe("touch")
    expect(pointerKind("mouse")).toBe("mouse")
    expect(pointerKind("")).toBe("unknown")
    expect(pointerKind(undefined)).toBe("unknown")
  })

  it("assumes a pen still lets the finger work until a pen is actually seen (Q9 default)", () => {
    expect(shouldCapture("touch", false)).toBe(true)
    expect(shouldCapture("pen", false)).toBe(true)
    expect(shouldCapture("mouse", false)).toBe(true)
  })

  it("rejects a palm once a pen has been seen, while pen and mouse keep working", () => {
    expect(isPalm("touch", true)).toBe(true)
    expect(shouldCapture("touch", true)).toBe(false)
    expect(shouldCapture("pen", true)).toBe(true)
    expect(shouldCapture("mouse", true)).toBe(true)
    expect(isPalm("pen", true)).toBe(false)
  })

  it("never treats an unknown pointer as a stroke", () => {
    expect(shouldCapture(undefined, false)).toBe(false)
    expect(shouldCapture("", false)).toBe(false)
  })

  it("withPenSeen latches on the first pen and never unlatches", () => {
    expect(withPenSeen(false, "touch")).toBe(false)
    expect(withPenSeen(false, "pen")).toBe(true)
    expect(withPenSeen(true, "touch")).toBe(true)
  })
})
