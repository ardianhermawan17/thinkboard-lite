import { describe, expect, it } from "vitest"
import { createThrottle } from "./throttle"

function clock() {
  let t = 0
  return { now: () => t, advance: (ms: number) => (t += ms) }
}

describe("cursor throttle (g2, RULE-20)", () => {
  it("sends the first point and drops an unchanged one", () => {
    const throttle = createThrottle(50, () => 0)
    expect(throttle.shouldSend({ x: 1, y: 1 })).toBe(true)
    expect(throttle.shouldSend({ x: 1, y: 1 })).toBe(false)
  })

  it("sends at most once per interval, then once it elapses", () => {
    const c = clock()
    const throttle = createThrottle(50, c.now)
    expect(throttle.shouldSend({ x: 0, y: 0 })).toBe(true)
    c.advance(20)
    expect(throttle.shouldSend({ x: 1, y: 0 })).toBe(false)
    c.advance(40)
    expect(throttle.shouldSend({ x: 2, y: 0 })).toBe(true)
  })

  it("does not resend a point that returned to the last sent one without moving through time", () => {
    const c = clock()
    const throttle = createThrottle(50, c.now)
    throttle.shouldSend({ x: 0, y: 0 })
    c.advance(100)
    expect(throttle.shouldSend({ x: 0, y: 0 })).toBe(false)
    expect(throttle.shouldSend({ x: 0, y: 1 })).toBe(true)
  })
})
