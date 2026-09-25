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
  client = createClient(env().url, env().key)
  return client
}

/**
 * A request-scoped client carrying one caller's own JWT (019's endpoints, RULE-01). Still this file only (I21):
 * the publishable key identifies the project, the bearer is what RLS authorizes. No secret key, ever.
 * No session persistence: a server request must not write a session to a shared process.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  const { url, key } = env()
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set (see frontend README)")
  return { url, key }
}

// Type re-exports so server and presence code can annotate without importing supabase-js itself (I21).
export type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"
