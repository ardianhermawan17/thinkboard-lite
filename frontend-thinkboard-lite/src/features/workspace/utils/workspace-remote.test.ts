import "fake-indexeddb/auto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { getDb, openDb } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"
import { META, createWorkspace, hasSession, pullWorkspaceMeta, saveTeamPersona, saveUserPersona, signIn, signOut, transferLeadership } from "./workspace-remote"

// The gate test for 008 (g1-g4): real RLS against the seeded local stack (database-thinkboard-lite: `npm run start`, `npm run db:seed`).
// It skips itself in `npm run verify` unless the stack's URL and publishable key are in the environment:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from `supabase status`> npm test
const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
const PASSWORD = "password" // the local seed's shared dev password (seed.sql)

type Member = { profile_id: string; role: string }
const roster = async () => ((await getDb().meta.get(META.members))?.value ?? []) as Member[]
const as = async (who: string) => {
  await signOut()
  return signIn(`${who}@thinkboard.test`, PASSWORD)
}

describe.skipIf(!live)("workspace remote, against the seeded stack under real RLS", () => {
  let leaderId: string
  let memberAId: string
  let seededTeamId: string
  let seededSessionId: string

  beforeAll(async () => {
    memberAId = await signIn("member-a@thinkboard.test", PASSWORD)
    leaderId = await as("leader")
    openDb(leaderId)
    const supabase = getSupabase()
    // the seeded team is the oldest one (the seed runs on an empty database; the tests below only add newer teams)
    seededTeamId = (await supabase.from("teams").select("id").order("created_at").limit(1).single()).data?.id as string
    const session = await supabase.from("sessions").select("id, board_columns!inner(boards!inner(team_id))").eq("board_columns.boards.team_id", seededTeamId).limit(1).single()
    seededSessionId = session.data?.id as string
  })

  afterAll(async () => {
    await signOut()
  })

  it("g1: a signed-in session is cached, and sign-out removes it", async () => {
    expect(await hasSession()).toBe(true)
    await signOut()
    expect(await hasSession()).toBe(false)
    await signIn("leader@thinkboard.test", PASSWORD)
  })

  it("g2: create_workspace makes the creator the leader and lands the workspace in Dexie meta", async () => {
    const { teamId, sessionId } = await createWorkspace("Gate workspace", "Gate title", "Gate goal")
    await pullWorkspaceMeta(teamId, sessionId, leaderId)
    const members = await roster()
    expect(members).toHaveLength(1)
    expect(members[0]).toMatchObject({ profile_id: leaderId, role: "leader" })
    expect((await getDb().meta.get(META.session))?.value).toMatchObject({ id: sessionId, title: "Gate title", initial_question: "Gate goal" })
  })

  it("g2: a failed create leaves no partial rows", async () => {
    const supabase = getSupabase()
    const before = (await supabase.from("teams").select("id", { count: "exact", head: true })).count
    await expect(createWorkspace(null as unknown as string, "t", "g")).rejects.toThrow()
    expect((await supabase.from("teams").select("id", { count: "exact", head: true })).count).toBe(before)
  })

  it("g3: after a transfer exactly one leader remains, and the new leader can hand it back", async () => {
    await pullWorkspaceMeta(seededTeamId, seededSessionId, leaderId)
    expect((await roster()).filter((m) => m.role === "leader").map((m) => m.profile_id)).toEqual([leaderId])

    await transferLeadership(seededTeamId, memberAId)
    expect((await roster()).filter((m) => m.role === "leader").map((m) => m.profile_id)).toEqual([memberAId])

    // the old leader can no longer transfer; restore the seed by handing it back as the new leader
    await expect(transferLeadership(seededTeamId, leaderId)).rejects.toThrow(/only the leader/)
    await as("member-a")
    await transferLeadership(seededTeamId, leaderId)
    expect((await roster()).filter((m) => m.role === "leader").map((m) => m.profile_id)).toEqual([leaderId])
    await as("leader")
  })

  it("g4: only the leader writes the team persona; a second active personal persona is rejected", async () => {
    await as("member-a")
    await expect(saveTeamPersona(seededTeamId, memberAId, "Not allowed", "x")).rejects.toThrow()

    await as("leader")
    await expect(saveTeamPersona(seededTeamId, leaderId, "Team rail", "Stay in scope")).resolves.toBeUndefined()

    await saveUserPersona(leaderId, "Me", "I am a careful reader")
    await expect(saveUserPersona(leaderId, "Me again", "second active")).rejects.toThrow(/duplicate|unique/i)
  })
})
