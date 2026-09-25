import { describe, expect, it } from "vitest"
import { errorMessage, ForbiddenError, httpStatusFor, NotFoundError, UnauthorizedError, ValidationError } from "./errors"

describe("error mapping (g2)", () => {
  it("maps each typed error to its status and everything else to 500", () => {
    expect(httpStatusFor(new UnauthorizedError())).toBe(401)
    expect(httpStatusFor(new ForbiddenError())).toBe(403)
    expect(httpStatusFor(new NotFoundError())).toBe(404)
    expect(httpStatusFor(new ValidationError())).toBe(400)
    expect(httpStatusFor(new Error("boom"))).toBe(500)
    expect(httpStatusFor("nope")).toBe(500)
  })

  it("exposes a message, never a stack", () => {
    expect(errorMessage(new ForbiddenError("only the leader"))).toBe("only the leader")
    expect(errorMessage({})).toBe("internal error")
  })
})
