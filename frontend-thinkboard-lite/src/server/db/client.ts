import { createUserClient, type SupabaseClient } from "@shared/lib/supabase"
import { UnauthorizedError } from "./errors"

/** The caller's bearer token, or null. The four commands take an explicit Authorization header; no cookies. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match ? match[1] : null
}

export type RequestContext = { db: SupabaseClient; profileId: string }

/**
 * The one place a request becomes a user-scoped database handle (RULE-01): validate the bearer, build the
 * request client from the one shared seam, and resolve the caller's profile through their own RLS-readable
 * identity row. A route calls this once and then exactly one service method (RULE-22).
 */
export async function requestContext(request: Request): Promise<RequestContext> {
  const token = bearerToken(request)
  if (!token) throw new UnauthorizedError()
  const db = createUserClient(token)

  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) throw new UnauthorizedError()

  const { data: identity, error: identityError } = await db.from("profile_identities").select("profile_id").eq("auth_user_id", auth.user.id).single()
  if (identityError || !identity) throw new UnauthorizedError("no profile for this account")
  return { db, profileId: identity.profile_id as string }
}
