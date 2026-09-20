// @vitest-environment node
// (jsdom's WebSocket is not a working Realtime client; the real one in Node is)
import "fake-indexeddb/auto"
import { deleteDb, getDb, insertHighlight, openDb, type RemoteEvent } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"
import type { UUID } from "@shared/types/domain/common"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { realDeps } from "./middleware/engine"
import { openChannels } from "./realtime/channel"

// The gate test for 007: real Postgres, PostgREST, RLS and Realtime on the seeded local stack (database-thinkboard-lite:
// `npm run start`, `npm run db:seed`). It skips itself in `npm run verify` unless the stack's URL and publishable key are set:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from `supabase status`> npm test
const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

const drain = () => realDeps.drain(new AbortController().signal)

describe.skipIf(!live)("sync engine, against the seeded stack", () => {
  let profileId: string
  let artifactId: string
  let sessionId: string
  const made: string[] = []

  const hl = async (page: number, art: string = artifactId) => {
    const row = await insertHighlight({ artifactId: art as UUID<"artifacts">, profileId: profileId as UUID<"profiles">, text: `sync ${page}`, page })
    made.push(row.id)
    return row
  }
  const onServer = async (ids: string[]) => ((await getSupabase().from("highlights").select("id").in("id", ids)).data ?? []).map((r) => r.id as string)

  beforeAll(async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({ email: "leader@thinkboard.test", password: "password" })
    if (error) throw error
    profileId = (await supabase.from("profile_identities").select("profile_id").eq("auth_user_id", data.user.id).single()).data?.profile_id as string
    openDb(profileId)
    const artifact = (await supabase.from("artifacts").select("id, session_id").limit(1).single()).data
    artifactId = artifact?.id as string
    sessionId = artifact?.session_id as string
  })

  afterAll(async () => {
    if (made.length) await getSupabase().from("highlights").delete().in("id", made)
    await getSupabase().auth.signOut()
    await deleteDb(profileId)
  })

  it("gate: three writes made offline land exactly once when the drain runs, and a second drain adds nothing", async () => {
    const rows = [await hl(101), await hl(102), await hl(103)]
    expect(await getDb().outbox.count()).toBe(3) // queued locally, nothing sent
    expect(await onServer(rows.map((r) => r.id))).toEqual([])

    const r = await drain()
    expect(r.sent).toHaveLength(3)
    expect((await onServer(rows.map((x) => x.id))).sort()).toEqual(rows.map((x) => x.id).sort())
    expect(await getDb().outbox.count()).toBe(0)
    expect((await getDb().highlights.get(rows[0].id))?._sync).toBe("clean")

    expect((await drain()).sent).toHaveLength(0)
    expect((await onServer(rows.map((x) => x.id))).length).toBe(3) // still exactly three
  })

  it("gate: a write the server refuses parks once and does not stall the ones behind it", async () => {
    const bad = await hl(111, crypto.randomUUID()) // an artifact that does not exist or is not mine: 4xx
    const good = await hl(112)
    const r = await drain()
    expect(r.parked.map((o) => o.rowId)).toEqual([bad.id])
    expect(r.sent.map((o) => o.rowId)).toEqual([good.id])
    expect(await onServer([bad.id, good.id])).toEqual([good.id])
    expect((await getDb().highlights.get(bad.id))?._sync).toBe("failed")
    await getDb().outbox.clear()
  })

  it("reconcile: a row missing locally comes back, and a row deleted on the server leaves Dexie", async () => {
    const row = await hl(121)
    await drain()
    await getDb().highlights.delete(row.id) // this device never saw it
    await realDeps.reconcile({ teamId: "", sessionId, profileId }, [artifactId])
    expect((await getDb().highlights.get(row.id))?.text).toBe("sync 121")

    await getSupabase().from("highlights").delete().eq("id", row.id) // another device deleted it while this one was away
    await realDeps.reconcile({ teamId: "", sessionId, profileId }, [artifactId])
    expect(await getDb().highlights.get(row.id)).toBeUndefined()
  })

  it("realtime: an insert and a delete made on the server arrive on the private topic", { timeout: 30_000 }, async () => {
    const seen: RemoteEvent[] = []
    const handle = await openChannels(sessionId, profileId, { onBatch: async (events) => void seen.push(...events), onDrop: () => {} })
    try {
      await new Promise((r) => setTimeout(r, 1500)) // the subscription must be joined before the change
      const row = await hl(131)
      await drain() // this device's own write comes back over its own user:{profileId} topic
      await waitUntil(() => seen.some((e) => e.type === "INSERT" && e.record?.id === row.id))
      await getSupabase().from("highlights").delete().eq("id", row.id)
      await waitUntil(() => seen.some((e) => e.type === "DELETE" && e.oldRecord?.id === row.id))
    } finally {
      handle.close()
    }
  })
})

async function waitUntil(check: () => boolean, ms = 10_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error("timed out waiting for the realtime event")
}
