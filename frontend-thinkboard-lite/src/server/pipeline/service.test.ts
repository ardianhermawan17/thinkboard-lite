import type { SupabaseClient } from "@shared/lib/supabase"
import { describe, expect, it, vi } from "vitest"
import { ForbiddenError, NotFoundError, ValidationError } from "../db/errors"
import { isResultScope, isRunMode, requestMiniConclusion, requestResult, subscribeRun } from "./service"

type Result = { data: unknown; error: unknown }

function fakeDb(opts: { session?: Result | null; highlight?: Result | null; insert?: Result; run?: Result; canLead?: boolean } = {}) {
  const inserted: Record<string, unknown>[] = []
  const session = opts.session === undefined ? { data: { id: "s1", default_mode: "descriptive" }, error: null } : opts.session
  const highlight = opts.highlight === undefined ? { data: { id: "h1" }, error: null } : opts.highlight
  const insert = opts.insert ?? { data: { id: "r1" }, error: null }
  const run = opts.run === undefined ? { data: { id: "r1", status: "pending" }, error: null } : opts.run
  const rpc = vi.fn(async () => ({ data: opts.canLead ?? true, error: null }))
  const db = {
    from(table: string) {
      if (table === "sessions") return { select: () => ({ eq: () => ({ single: async () => session }) }) }
      if (table === "highlights") return { select: () => ({ eq: () => ({ single: async () => highlight }) }) }
      if (table === "pipeline_runs")
        return {
          insert: (row: Record<string, unknown>) => {
            inserted.push(row)
            return { select: () => ({ single: async () => insert }) }
          },
          select: () => ({ eq: () => ({ single: async () => run }) }),
        }
      throw new Error(`unexpected table ${table}`)
    },
    rpc,
  }
  return { db: db as unknown as SupabaseClient, inserted, rpc }
}

describe("requestResult (g5)", () => {
  it("individual: the owner is the caller and mode falls back to the session default", async () => {
    const { db, inserted } = fakeDb()
    await expect(requestResult(db, { sessionId: "s1", scope: "individual" }, "p1")).resolves.toEqual({ id: "r1", status: "pending" })
    expect(inserted[0]).toMatchObject({ session_id: "s1", owner_profile_id: "p1", mode: "descriptive", status: "pending" })
  })

  it("group: the leader is allowed and the owner is null", async () => {
    const { db, inserted, rpc } = fakeDb({ canLead: true })
    await requestResult(db, { sessionId: "s1", scope: "group" }, "p1")
    expect(rpc).toHaveBeenCalledWith("can_lead_session", { target_session: "s1" })
    expect(inserted[0].owner_profile_id).toBeNull()
  })

  it("group without leadership is refused before any write", async () => {
    const { db, inserted } = fakeDb({ canLead: false })
    await expect(requestResult(db, { sessionId: "s1", scope: "group" }, "p1")).rejects.toBeInstanceOf(ForbiddenError)
    expect(inserted).toHaveLength(0)
  })

  it("an unknown workspace is NotFound and an unknown mode is invalid", async () => {
    await expect(requestResult(fakeDb({ session: { data: null, error: new Error("no rows") } }).db, { sessionId: "x", scope: "individual" }, "p1")).rejects.toBeInstanceOf(NotFoundError)
    await expect(requestResult(fakeDb({ session: { data: { id: "s1", default_mode: "weird" }, error: null } }).db, { sessionId: "s1", scope: "individual" }, "p1")).rejects.toBeInstanceOf(ValidationError)
  })

  it("honours an explicit mode", async () => {
    const { db, inserted } = fakeDb()
    await requestResult(db, { sessionId: "s1", scope: "individual", mode: "visualize" }, "p1")
    expect(inserted[0].mode).toBe("visualize")
  })
})

describe("requestMiniConclusion (g1)", () => {
  it("reports queued for a highlight the caller can see, and NotFound for one they cannot", async () => {
    await expect(requestMiniConclusion(fakeDb().db, { highlightId: "h1" })).resolves.toEqual({ status: "queued" })
    await expect(requestMiniConclusion(fakeDb({ highlight: { data: null, error: new Error("no rows") } }).db, { highlightId: "h1" })).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("subscribeRun", () => {
  it("emits a snapshot then done, and throws NotFound for an unseen run", async () => {
    const events: string[] = []
    for await (const event of subscribeRun(fakeDb().db, "r1", new AbortController().signal)) events.push(event.type)
    expect(events).toEqual(["snapshot", "done"])

    const gen = subscribeRun(fakeDb({ run: { data: null, error: new Error("no") } }).db, "r1", new AbortController().signal)
    await expect(gen.next()).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe("input vocabulary", () => {
  it("recognises the scope and mode enums", () => {
    expect(isResultScope("individual")).toBe(true)
    expect(isResultScope("group")).toBe(true)
    expect(isResultScope("everyone")).toBe(false)
    expect(isRunMode("descriptive")).toBe(true)
    expect(isRunMode("nope")).toBe(false)
  })
})
