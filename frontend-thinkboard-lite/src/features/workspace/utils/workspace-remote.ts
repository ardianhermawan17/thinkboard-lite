import { putMeta } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"

// ponytail: 008 talks to Supabase directly and online (owner-approved 2026-09-20): the sync engine (007) and the command
// endpoints (017) do not exist yet. When they land, the pull becomes 007's engine and create/transfer/persona writes
// become outbox `rpc` ops; the meta keys below and every reader stay as they are.

/** The Dexie `meta` keys this context owns (DB-Q12). */
export const META = {
  team: "team",
  members: "members",
  session: "session",
  teamPersona: "teamPersona",
  userPersona: "userPersona",
} as const

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

/** The profile behind the signed-in auth user (`profile_identities`, readable by its owner under RLS). */
async function profileIdOf(authUserId: string): Promise<string> {
  const row = check(await getSupabase().from("profile_identities").select("profile_id").eq("auth_user_id", authUserId).single())
  if (!row) throw new Error("no profile for this account")
  return row.profile_id as string
}

export async function signIn(email: string, password: string): Promise<string> {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return profileIdOf(data.user.id)
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut()
  if (error) throw new Error(error.message)
}

/** Reads the cached session from storage: no network, so an offline reopen works (RULE-14). */
export async function hasSession(): Promise<boolean> {
  const { data } = await getSupabase().auth.getSession()
  return data.session !== null
}

/** team + board + column + session in one transaction, server-side (DB-Q6). The creator is the leader. */
export async function createWorkspace(name: string, title: string, goal: string): Promise<{ teamId: string; sessionId: string }> {
  const sessionId = check(await getSupabase().rpc("create_workspace", { p_name: name, p_title: title, p_goal: goal })) as string
  return { teamId: await teamOfSession(sessionId), sessionId }
}

/** A workspace URL carries the session id; its team is one join away (session -> column -> board -> team). */
export async function teamOfSession(sessionId: string): Promise<string> {
  const row = check(await getSupabase().from("sessions").select("id, board_columns(boards(team_id))").eq("id", sessionId).single())
  return (row as unknown as { board_columns: { boards: { team_id: string } } }).board_columns.boards.team_id
}

/** The leader hands the role to an existing member; the RPC demotes first, so exactly one leader remains (D-09). */
export async function transferLeadership(teamId: string, toProfileId: string): Promise<void> {
  check(await getSupabase().rpc("transfer_leadership", { p_team: teamId, p_to_profile: toProfileId }))
  await pullMembers(teamId)
}

async function pullMembers(teamId: string): Promise<void> {
  const rows = check(
    await getSupabase().from("team_members").select("profile_id, role, joined_at, profiles(full_name, email)").eq("team_id", teamId).order("joined_at")
  )
  await putMeta(META.members, rows)
}

/** DB-Q12: the non-mirrored rows a workspace needs, pulled once into Dexie `meta` (007's engine replaces this). */
export async function pullWorkspaceMeta(teamId: string, sessionId: string, profileId: string): Promise<void> {
  const supabase = getSupabase()
  await putMeta(META.team, check(await supabase.from("teams").select("id, name, slug").eq("id", teamId).single()))
  await putMeta(META.session, check(await supabase.from("sessions").select("id, title, initial_question, default_mode").eq("id", sessionId).single()))
  await pullMembers(teamId)
  await putMeta(
    META.teamPersona,
    check(await supabase.from("team_personas").select("id, name, guard_prompt").eq("team_id", teamId).eq("is_active", true).maybeSingle())
  )
  await putMeta(
    META.userPersona,
    check(await supabase.from("user_personas").select("id, name, system_prompt").eq("owner_profile_id", profileId).eq("is_active", true).maybeSingle())
  )
}

/** One active team persona per team (`team_personas_one_active`); only the leader may write it (RLS "leader sets rail"). */
export async function saveTeamPersona(teamId: string, profileId: string, name: string, guardPrompt: string, existingId?: string): Promise<void> {
  const table = getSupabase().from("team_personas")
  check(
    existingId
      ? await table.update({ name, guard_prompt: guardPrompt, decided_by: profileId }).eq("id", existingId)
      : await table.insert({ team_id: teamId, name, guard_prompt: guardPrompt, decided_by: profileId })
  )
}

/** One active personal persona per person (D-04, `user_personas_one_active_per_owner`); RLS lets the owner write it. */
export async function saveUserPersona(profileId: string, name: string, systemPrompt: string, existingId?: string): Promise<void> {
  const table = getSupabase().from("user_personas")
  check(
    existingId
      ? await table.update({ name, system_prompt: systemPrompt }).eq("id", existingId)
      : await table.insert({ owner_profile_id: profileId, name, system_prompt: systemPrompt })
  )
}
