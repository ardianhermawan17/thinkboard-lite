// @vitest-environment node
import { getSupabase } from "@shared/lib/supabase"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { POST as resultsRoute } from "../app/api/v1/workspaces/[id]/results/route"

// 017's live gate: the four command endpoints run under the caller's own JWT, and a member's group run is 403.
// It skips itself in `npm run verify` unless the seeded stack's URL and publishable key are set:
//   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:56321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY> npm test
const live = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

const request = (body: unknown, token?: string) =>
  new Request("http://test/api/v1/workspaces/s1/results", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}`, "content-type": "application/json" } : { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
const context = (id: string) => ({ params: Promise.resolve({ id }) })

async function tokenFor(email: string): Promise<string> {
  const supabase = getSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password: "password" })
  if (error) throw error
  const session = (await supabase.auth.getSession()).data.session
  if (!session) throw new Error("no session")
  return session.access_token
}

describe.skipIf(!live)("command endpoints, against the seeded stack (017)", () => {
  let member: string
  let leader: string
  let sessionId: string
  const made: string[] = []

  beforeAll(async () => {
    member = await tokenFor("member-a@thinkboard.test")
    leader = await tokenFor("leader@thinkboard.test")
    const supabase = getSupabase()
    const { data } = await supabase.from("sessions").select("id").limit(1).single()
    sessionId = data?.id as string
  })

  afterAll(async () => {
    if (made.length) await getSupabase().from("pipeline_runs").delete().in("id", made)
    await getSupabase().auth.signOut()
  })

  it("a request with no bearer is 401", async () => {
    expect((await resultsRoute(request({ scope: "individual" }), context(sessionId))).status).toBe(401)
  })

  it("a member's group run is 403; their individual run is accepted", async () => {
    const group = await resultsRoute(request({ scope: "group" }, member), context(sessionId))
    expect(group.status).toBe(403)

    const individual = await resultsRoute(request({ scope: "individual" }, member), context(sessionId))
    expect(individual.status).toBe(202)
    made.push(((await individual.json()) as { id: string }).id)
  })

  it("the leader's group run is accepted", async () => {
    const response = await resultsRoute(request({ scope: "group" }, leader), context(sessionId))
    expect(response.status).toBe(202)
    made.push(((await response.json()) as { id: string }).id)
  })

  it("an invalid scope is 400 before any service call", async () => {
    expect((await resultsRoute(request({ scope: "everyone" }, leader), context(sessionId))).status).toBe(400)
  })
})
