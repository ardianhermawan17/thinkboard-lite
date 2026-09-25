import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ createUserClient: vi.fn() }))
vi.mock("@shared/lib/supabase", () => ({ createUserClient: mocks.createUserClient }))

import { bearerToken, requestContext } from "./client"
import { UnauthorizedError } from "./errors"

function fakeClient({ user = { id: "u1" } as { id: string } | null, profileId = "p1" as string | null } = {}) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: user ? null : new Error("bad jwt") })) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: profileId ? { profile_id: profileId } : null, error: profileId ? null : new Error("none") }) }) }),
    }),
  }
}

const request = (headers: Record<string, string> = {}) => new Request("http://test/api", { method: "POST", headers })

afterEach(() => vi.clearAllMocks())

describe("bearerToken", () => {
  it("reads a Bearer token case-insensitively and rejects anything else", () => {
    expect(bearerToken(request({ authorization: "Bearer abc.def" }))).toBe("abc.def")
    expect(bearerToken(request({ authorization: "bearer xyz" }))).toBe("xyz")
    expect(bearerToken(request({ authorization: "Basic abc" }))).toBeNull()
    expect(bearerToken(request())).toBeNull()
  })
})

describe("requestContext (g4)", () => {
  it("rejects a request with no or a malformed Authorization header", async () => {
    await expect(requestContext(request())).rejects.toBeInstanceOf(UnauthorizedError)
    await expect(requestContext(request({ authorization: "Token abc" }))).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it("builds a client from the one shared seam and resolves the profile under the token", async () => {
    mocks.createUserClient.mockReturnValue(fakeClient())
    const ctx = await requestContext(request({ authorization: "Bearer jwt123" }))
    expect(mocks.createUserClient).toHaveBeenCalledWith("jwt123")
    expect(ctx.profileId).toBe("p1")
  })

  it("rejects an invalid token and an account with no profile", async () => {
    mocks.createUserClient.mockReturnValueOnce(fakeClient({ user: null }))
    await expect(requestContext(request({ authorization: "Bearer nope" }))).rejects.toBeInstanceOf(UnauthorizedError)
    mocks.createUserClient.mockReturnValueOnce(fakeClient({ profileId: null }))
    await expect(requestContext(request({ authorization: "Bearer jwt" }))).rejects.toBeInstanceOf(UnauthorizedError)
  })
})
