import type { SupabaseClient } from "@shared/lib/supabase"

export type GroupMinute = { id: string; content: string; created_by: string | null; created_at: string }

/**
 * The group notulen the group result reads (spec §5.5: group notes + promoted notes + leader minutes). RLS:
 * `scope='group'` rows are visible to session members. The memory package's first real member; 020 reads it.
 */
export async function readGroupMinutes(db: SupabaseClient, sessionId: string): Promise<GroupMinute[]> {
  const { data, error } = await db.from("memory_entries").select("id, content, created_by, created_at").eq("session_id", sessionId).eq("scope", "group")
  if (error) throw error
  return (data ?? []) as GroupMinute[]
}
