/** Shapes of the `meta` rows this context reads (wire names, as pulled by workspace-remote). */
export type MemberMeta = {
  profile_id: string
  role: string
  joined_at: string
  profiles: { full_name: string | null; email: string } | null
}
export type TeamPersonaMeta = { id: string; name: string; guard_prompt: string }
export type UserPersonaMeta = { id: string; name: string; system_prompt: string }
export type SessionMeta = { id: string; title: string; initial_question: string; default_mode: string }
export type TeamMeta = { id: string; name: string; slug: string }
