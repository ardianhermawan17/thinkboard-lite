import "fake-indexeddb/auto"
import { deleteDb, openDb, type OutboxOp, type ThinkboardDb, bumpAttempts, confirmOp, insertHighlight, insertNote, nextQueuedOp, parkOp } from "@feature/entities"
import type { UUID } from "@shared/types/domain/common"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { SendResult } from "./backoff"
import { drainOutbox, type PushDeps } from "./push"

const ART = "art-1" as UUID<"artifacts">
const ME = "me" as UUID<"profiles">
const OK: SendResult = { status: 201, error: null }
const deny: SendResult = { status: 403, error: { message: "new row violates row-level security policy" } }

let db: ThinkboardDb
let profile: string
beforeEach(async () => {
  profile = `t-${crypto.randomUUID()}`
  db = openDb(profile)
  await db.open()
})
afterEach(() => deleteDb(profile))

const deps = (send: PushDeps["send"], refreshAuth: PushDeps["refreshAuth"] = async () => true): PushDeps => ({
  next: nextQueuedOp,
  send,
  confirm: confirmOp,
  park: parkOp,
  bump: bumpAttempts,
  refreshAuth,
})
const run = (d: PushDeps) => drainOutbox(d, new AbortController().signal)
const hl = (page = 1) => insertHighlight({ artifactId: ART, profileId: ME, text: "t", page })

describe("outbox push (g1, g2)", () => {
  it("drains in strict seq order, one op at a time, and leaves the rows clean", async () => {
    const h = await hl()
    const n = await insertNote({ highlightId: h.id, profileId: ME, content: "a" })
    const seen: string[] = []
    const r = await run(deps(async (op) => (seen.push(`${op.seq}:${op.table}`), OK)))
    expect(seen).toEqual(["1:highlights", "2:notes"]) // the note never lands before its highlight (FK)
    expect(r).toMatchObject({ stopped: "empty" })
    expect(await db.outbox.count()).toBe(0)
    expect((await db.highlights.get(h.id))?._sync).toBe("clean")
    expect((await db.notes.get(n.id))?._sync).toBe("clean")
  })

  it("F1: a 403 parks the op ONCE and the ops queued behind it still go out", async () => {
    const bad = await hl(1)
    const good = await hl(2)
    const send = vi.fn(async (op: OutboxOp) => (op.rowId === bad.id ? deny : OK))
    const r = await run(deps(send))
    expect(send).toHaveBeenCalledTimes(2) // the parked op is tried once, never again
    expect(r.parked.map((o) => o.rowId)).toEqual([bad.id])
    expect(r.sent.map((o) => o.rowId)).toEqual([good.id])
    expect((await db.highlights.get(bad.id))?._sync).toBe("failed") // F2: the row says so
    expect((await db.highlights.get(good.id))?._sync).toBe("clean")
    expect(await db.outbox.toArray()).toMatchObject([{ rowId: bad.id, state: "failed", lastError: expect.stringContaining("row-level security") }])
  })

  it("F1: ops behind a parked parent park with it (a note cannot land without its highlight)", async () => {
    const h = await hl()
    const n = await insertNote({ highlightId: h.id, profileId: ME })
    const send = vi.fn(async (op: OutboxOp) => (op.table === "highlights" ? deny : OK))
    const r = await run(deps(send))
    expect(send).toHaveBeenCalledTimes(1) // the note was never sent
    expect(r.parked.map((o) => o.table)).toEqual(["highlights", "notes"])
    expect((await db.notes.get(n.id))?._sync).toBe("failed")
    expect(await nextQueuedOp()).toBeUndefined() // nothing queued is left to stall on
  })

  it("g2: a 503 keeps the op queued with backoff and is retried; it lands exactly once", async () => {
    const h = await hl()
    let calls = 0
    const send = async (): Promise<SendResult> => (++calls === 1 ? { status: 503, error: { message: "unavailable" } } : OK)
    const first = await run(deps(send))
    expect(first.stopped).toBe("transient")
    expect(first.retryInMs).toBeGreaterThan(0)
    expect(await db.outbox.toArray()).toMatchObject([{ rowId: h.id, state: "queued", attempts: 1 }])
    expect((await db.highlights.get(h.id))?._sync).toBe("pending")

    const second = await run(deps(send))
    expect(second.sent.map((o) => o.rowId)).toEqual([h.id])
    expect(calls).toBe(2)
    expect(await db.outbox.count()).toBe(0)
  })

  it("g2: a network failure (status 0) is transient too", async () => {
    await hl()
    const r = await run(deps(async () => ({ status: 0, error: { message: "Failed to fetch" } })))
    expect(r.stopped).toBe("transient")
    expect(await db.outbox.count()).toBe(1)
  })

  it("a 401 refreshes once and retries; a second 401 parks instead of looping", async () => {
    await hl(1)
    const refresh = vi.fn(async () => true)
    const unauthorized: SendResult = { status: 401, error: { message: "JWT expired" } }
    let calls = 0
    const r1 = await run(deps(async () => (++calls === 1 ? unauthorized : OK), refresh))
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(r1.sent).toHaveLength(1)

    await hl(2)
    const r2 = await run(deps(async () => unauthorized, refresh))
    expect(r2.parked).toHaveLength(1)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it("stops between ops when aborted", async () => {
    await hl(1)
    await hl(2)
    const ac = new AbortController()
    const r = await drainOutbox(deps(async () => (ac.abort(), OK)), ac.signal)
    expect(r.stopped).toBe("aborted")
    expect(r.sent).toHaveLength(1)
    expect(await db.outbox.count()).toBe(1)
  })
})
