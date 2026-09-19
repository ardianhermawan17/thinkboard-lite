import { describe, expect, it } from "vitest"
import type { ISODateString, UUID } from "./common"

// The whole point of the brands. The `@ts-expect-error` lines must FAIL to compile: `npm run typecheck` (in verify)
// turns a brand that stops working into an "unused @ts-expect-error" error.
describe("domain brands", () => {
  it("keep the ids of different tables apart", () => {
    const session = "s" as UUID<"sessions">
    // @ts-expect-error a sessions id is not a highlights id
    const highlight: UUID<"highlights"> = session
    // @ts-expect-error a bare string is not an id
    const bare: UUID = "x"
    // @ts-expect-error a bare string is not a timestamp
    const at: ISODateString = "2026-09-19T00:00:00Z"
    const any: UUID = session // a specific id is accepted where any id is
    expect([highlight, bare, at, any]).toHaveLength(4)
  })
})
