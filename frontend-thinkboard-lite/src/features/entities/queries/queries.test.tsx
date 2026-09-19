import "fake-indexeddb/auto"
import type { UUID } from "@shared/types/domain/common"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { deleteDb, openDb } from "../db"
import { insertHighlight } from "../repository"
import { useHighlightsForPage, useOutboxCount } from "./index"

const ART = "art-1" as UUID<"artifacts">
let profile: string
beforeEach(async () => {
  profile = `t-${crypto.randomUUID()}`
  await openDb(profile).open()
})
afterEach(async () => {
  cleanup()
  await deleteDb(profile)
})

describe("queries (g3): live reads over the local database", () => {
  it("useHighlightsForPage follows a repository write without a refetch, and only for its own page", async () => {
    const { result } = renderHook(() => useHighlightsForPage(ART, 1))
    expect(result.current).toBeUndefined() // in flight
    await waitFor(() => expect(result.current).toEqual([]))

    await insertHighlight({ artifactId: ART, profileId: "me" as UUID<"profiles">, text: "on page 1", page: 1 })
    await insertHighlight({ artifactId: ART, profileId: "me" as UUID<"profiles">, text: "on page 2", page: 2 })
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current?.[0].text).toBe("on page 1")
  })

  it("useOutboxCount counts queued ops as writes arrive", async () => {
    const { result } = renderHook(() => useOutboxCount())
    await waitFor(() => expect(result.current).toEqual({ queued: 0, failed: 0 }))
    await insertHighlight({ artifactId: ART, profileId: "me" as UUID<"profiles">, text: "x", page: 1 })
    await waitFor(() => expect(result.current).toEqual({ queued: 1, failed: 0 }))
  })
})
