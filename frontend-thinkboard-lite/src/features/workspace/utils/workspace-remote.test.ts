import "fake-indexeddb/auto"
import { deleteDb, getDb, META, openDb } from "@feature/entities"
import { pullMeta } from "@feature/sync/bootstrap/pull-meta"
import { realDeps } from "@feature/sync/middleware/engine"
import { getSupabase } from "@shared/lib/supabase"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { MemberMeta } from "../types/meta"
import { createWorkspace, hasSession, listWorkspaces, saveTeamPersona, saveUserPersona, signIn, signOut, transferLeadership } from "./workspace-remote"

// The gate test for 008 (g1-g4) and 007 g7: real RLS against the seeded local stack (database-thinkboard-lite: `npm run start`, `npm run db:seed`).
// It skips itself in `npm run verify` unless the stack's URL and publishable key are in the environment:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:56321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from `supabase status`> npm test
const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
const PASSWORD = "password" // the local seed's shared dev password (seed.sql)

const drain = () => realDeps.drain(new AbortController().signal)
const roster = async () => ((await getDb().meta.get(META.members))?.value ?? []) as MemberMeta[]
const leaders = async () => (await roster()).filter((m) => m.role === "leader").map((m) => m.profile_id)

describe.skipIf(!live)("workspace remote, against the seeded stack under real RLS", () => {
  const profiles: Record<string, string> = {}
  let seededTeamId: string
  let seededSessionId: string

  /** Switching user = sign in + that profile's own Dexie database (DB-Q3). */
  const as = async (who: string) => {
    await signOut()
    profiles[who] = await signIn(`${who}@thinkboard.test`, PASSWORD)
    openDb(profiles[who])
    return profiles[who]
  }

  beforeAll(async () => {
    await signIn("member-a@thinkboard.test", PASSWORD).then((id) => (profiles["member-a"] = id))
    await as("leader")
    const supabase = getSupabase()
    // the seeded team is the oldest one (the seed runs on an empty database; the tests below only add newer teams)
    seededTeamId = (await supabase.from("teams").select("id").order("created_at").limit(1).single()).data?.id as string
    const session = await supabase.from("sessions").select("id, board_columns!inner(boards!inner(team_id))").eq("board_columns.boards.team_id", seededTeamId).limit(1).single()
    seededSessionId = session.data?.id as string
  })

  afterAll(async () => {
    await signOut()
    await Promise.all(Object.values(profiles).map((p) => deleteDb(p)))
  })

  it("g1: a signed-in session is cached, and sign-out removes it", async () => {
    expect(await hasSession()).toBe(true)
    await signOut()
    expect(await hasSession()).toBe(false)
    await as("leader")
  })

  it("g2: create_workspace makes the creator the only member and the leader", async () => {
    const { teamId } = await createWorkspace("Gate workspace", "Gate title", "Gate goal")
    const members = (await getSupabase().from("team_members").select("profile_id, role").eq("team_id", teamId)).data
    expect(members).toEqual([{ profile_id: profiles.leader, role: "leader" }])
  })

  it("g2: a failed create leaves no partial rows", async () => {
    const supabase = getSupabase()
    const before = (await supabase.from("teams").select("id", { count: "exact", head: true })).count
    await expect(createWorkspace(null as unknown as string, "t", "g")).rejects.toThrow()
    expect((await supabase.from("teams").select("id", { count: "exact", head: true })).count).toBe(before)
  })

  it("g7: the meta pull fills teams, roster, personas and providers into Dexie", async () => {
    await pullMeta(seededTeamId, seededSessionId, profiles.leader)
    expect((await getDb().meta.get(META.team))?.value).toMatchObject({ id: seededTeamId })
    expect((await roster()).length).toBeGreaterThanOrEqual(3)
    expect(((await getDb().meta.get(META.llmProviders))?.value as unknown[]).length).toBeGreaterThan(0)
  })

  it("g3: a transfer rides the outbox; the roster changes at once, and exactly one leader remains once it is sent", async () => {
    await pullMeta(seededTeamId, seededSessionId, profiles.leader)
    expect(await leaders()).toEqual([profiles.leader])

    await transferLeadership(seededTeamId, profiles["member-a"], await roster())
    expect(await leaders()).toEqual([profiles["member-a"]]) // optimistic, before any network
    expect((await drain()).sent).toHaveLength(1)
    await pullMeta(seededTeamId, seededSessionId, profiles.leader)
    expect(await leaders()).toEqual([profiles["member-a"]])

    // the old leader can no longer transfer: the op parks instead of retrying forever
    await transferLeadership(seededTeamId, profiles.leader, await roster())
    expect((await drain()).parked).toHaveLength(1)
    await getDb().outbox.clear()

    // restore the seed: the new leader hands it back
    await as("member-a")
    await pullMeta(seededTeamId, seededSessionId, profiles["member-a"])
    await transferLeadership(seededTeamId, profiles.leader, await roster())
    expect((await drain()).sent).toHaveLength(1)
    await pullMeta(seededTeamId, seededSessionId, profiles["member-a"])
    expect(await leaders()).toEqual([profiles.leader])
    await as("leader")
  })

  it("g4: a member's team-persona write parks (RLS), the leader's lands, and a second active personal persona parks", async () => {
    await as("member-a")
    await saveTeamPersona(seededTeamId, profiles["member-a"], "Not allowed", "x")
    expect((await drain()).parked).toHaveLength(1)
    expect(await getDb().outbox.where("state").equals("failed").count()).toBe(1)

    await as("leader")
    // the app knows the existing persona ids from `meta` and updates them; a fresh insert would hit the one-active index
    await pullMeta(seededTeamId, seededSessionId, profiles.leader)
    const idOf = async (key: string) => ((await getDb().meta.get(key))?.value as { id: string } | null)?.id
    await saveTeamPersona(seededTeamId, profiles.leader, "Team rail", "Stay in scope", await idOf(META.teamPersona))
    expect((await drain()).sent).toHaveLength(1)
    await saveUserPersona(profiles.leader, "Me", "I am a careful reader", await idOf(META.userPersona))
    expect((await drain()).sent).toHaveLength(1)
    await pullMeta(seededTeamId, seededSessionId, profiles.leader)

    await saveUserPersona(profiles.leader, "Me again", "second active") // no existingId: a second insert
    const second = await drain()
    expect(second.parked).toHaveLength(1)
    expect(second.parked[0].lastError).toMatch(/duplicate|unique/i)
  })

  it("g5: the landing list is exactly the workspaces this account can open, and RLS scopes it", async () => {
    await as("leader")
    const created = await createWorkspace("Landing list", "Landing title", "Landing goal")
    const mine = await listWorkspaces()
    expect(mine.map((w) => w.id)).toContain(created.sessionId)

    // a member of the seeded team sees the seeded workspace, never the new team's (that team has only its leader)
    await as("member-a")
    const theirs = await listWorkspaces()
    expect(theirs.map((w) => w.id)).toContain(seededSessionId)
    expect(theirs.map((w) => w.id)).not.toContain(created.sessionId)

    await as("leader")
  })
})
