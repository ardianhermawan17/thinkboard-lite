import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

/**
 * The one Supabase client (I21: the only place besides realtime/channel.ts that imports supabase-js).
 * Publishable key only (RULE-01): RLS is the authorization layer, there is no service-role key in the client.
 * supabase-js keeps the session in localStorage and refreshes it lazily, so an offline reopen reads it without a token round trip (RULE-14).
 * Lazy, so nothing runs at import (SSR).
 */
export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set (see frontend README)")
  client = createClient(url, key)
  return client
}
