import { META, putMeta } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"

function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

/**
 * DB-Q12 (g7): the non-mirrored rows a workspace needs, pulled into Dexie `meta` so no component reads them over the network.
 * Runs AFTER the outbox drains, never before: a queued persona or leadership change is shown optimistically in `meta`, and
 * pulling first would overwrite it with the old server value (RULE-13).
 */
export async function pullMeta(teamId: string, sessionId: string, profileId: string): Promise<void> {
  const supabase = getSupabase()
  await putMeta(META.team, check(await supabase.from("teams").select("id, name, slug").eq("id", teamId).single()))
  await putMeta(META.session, check(await supabase.from("sessions").select("id, title, initial_question, default_mode").eq("id", sessionId).single()))
  await putMeta(
    META.members,
    check(await supabase.from("team_members").select("profile_id, role, joined_at, profiles(full_name, email)").eq("team_id", teamId).order("joined_at"))
  )
  await putMeta(
    META.teamPersona,
    check(await supabase.from("team_personas").select("id, name, guard_prompt").eq("team_id", teamId).eq("is_active", true).maybeSingle())
  )
  await putMeta(
    META.userPersona,
    check(await supabase.from("user_personas").select("id, name, system_prompt").eq("owner_profile_id", profileId).eq("is_active", true).maybeSingle())
  )
  await putMeta(META.llmProviders, check(await supabase.from("llm_providers").select("id, key, label, base_url, is_active").order("label")))
  await putMeta(
    META.llmModels,
    check(await supabase.from("llm_models").select("id, provider_id, model_key, label, is_free_tier, is_active").order("model_key"))
  )
  // no `embedding`: a 1536-float column has no business in the local mirror
  await putMeta(
    META.memoryEntries,
    check(
      await supabase
        .from("memory_entries")
        .select("id, scope, kind, content, session_id, team_id, created_at")
        .or(`session_id.eq.${sessionId},team_id.eq.${teamId}`)
    )
  )
}
