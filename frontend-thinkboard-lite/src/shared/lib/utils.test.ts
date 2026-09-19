import { describe, expect, it } from "vitest"
import { cn } from "@shared/lib/utils"

describe("cn", () => {
  it("joins class names and drops falsy ones, through the @shared alias", () => {
    expect(cn("a", false && "b", "c")).toBe("a c")
  })
})
