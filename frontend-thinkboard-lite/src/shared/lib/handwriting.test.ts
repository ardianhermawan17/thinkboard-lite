import { describe, expect, it, vi } from "vitest"
import { detectHandwritingSupport, watchForPen } from "./handwriting"

describe("detectHandwritingSupport", () => {
  it("reports no capability assumed until a pen is actually seen", () => {
    expect(detectHandwritingSupport()).toEqual({ pen: false, osStylusText: false, localRecognizer: false })
  })
})

describe("watchForPen", () => {
  it("fires once on the first pen pointerdown, and ignores touch/mouse", () => {
    const onPenDetected = vi.fn()
    const unsubscribe = watchForPen(onPenDetected)

    window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }))
    expect(onPenDetected).not.toHaveBeenCalled()

    window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "pen" }))
    expect(onPenDetected).toHaveBeenCalledTimes(1)

    window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "pen" }))
    expect(onPenDetected).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it("unsubscribe stops future detection", () => {
    const onPenDetected = vi.fn()
    const unsubscribe = watchForPen(onPenDetected)
    unsubscribe()
    window.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "pen" }))
    expect(onPenDetected).not.toHaveBeenCalled()
  })
})
