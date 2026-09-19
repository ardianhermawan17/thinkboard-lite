import { describe, expect, it } from "vitest"
import { uuidv7 } from "./uuid7"

describe("uuidv7", () => {
  it("is a version 7 uuid with the RFC variant bits", () => {
    expect(uuidv7()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it("carries the millisecond timestamp in its first 48 bits, so ids sort by time", () => {
    const early = uuidv7(1_700_000_000_000)
    const late = uuidv7(1_700_000_000_001)
    expect(Number.parseInt(early.replace(/-/g, "").slice(0, 12), 16)).toBe(1_700_000_000_000)
    expect(early < late).toBe(true)
  })

  it("does not repeat", () => {
    expect(new Set(Array.from({ length: 2000 }, () => uuidv7())).size).toBe(2000)
  })
})
