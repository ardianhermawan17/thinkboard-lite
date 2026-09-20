import { META, putMetaAndEnqueue, uuidv7 } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"
import type { MemberMeta } from "../types/meta"

// Sign-in, sign-out and create_workspace are online by nature (an account, and a new session id to navigate to) and stay direct;
// 017's endpoint will wrap create_workspace. Everything else is a write to a non-mirrored row: its `meta` value changes at once
// and the op rides the outbox (RULE-08), so it works offline and parks on a 4xx like any other write (task 007, g7).

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

/** The leader hands the role to an existing member (D-09). The roster shows it at once; the RPC demotes first, so one leader remains. */
export async function transferLeadership(teamId: string, toProfileId: string, roster: MemberMeta[]): Promise<void> {
  const next = roster.map((m) => ({ ...m, role: m.profile_id === toProfileId ? "leader" : m.role === "leader" ? "member" : m.role }))
  await putMetaAndEnqueue(META.members, next, {
    rowId: teamId,
    table: "team_members",
    op: "rpc",
    fn: "transfer_leadership",
    payload: { p_team: teamId, p_to_profile: toProfileId },
  })
}

/** One active team persona per team (`team_personas_one_active`); only the leader may write it (RLS "leader sets rail"), else the op parks. */
export async function saveTeamPersona(teamId: string, profileId: string, name: string, guardPrompt: string, existingId?: string): Promise<void> {
  const id = existingId ?? uuidv7()
  await putMetaAndEnqueue(
    META.teamPersona,
    { id, name, guard_prompt: guardPrompt },
    { rowId: id, table: "team_personas", op: existingId ? "update" : "insert", payload: { id, team_id: teamId, name, guard_prompt: guardPrompt, decided_by: profileId } }
  )
}

/** One active personal persona per person (D-04, `user_personas_one_active_per_owner`); RLS lets the owner write it. */
export async function saveUserPersona(profileId: string, name: string, systemPrompt: string, existingId?: string): Promise<void> {
  const id = existingId ?? uuidv7()
  await putMetaAndEnqueue(
    META.userPersona,
    { id, name, system_prompt: systemPrompt },
    { rowId: id, table: "user_personas", op: existingId ? "update" : "insert", payload: { id, owner_profile_id: profileId, name, system_prompt: systemPrompt } }
  )
}
