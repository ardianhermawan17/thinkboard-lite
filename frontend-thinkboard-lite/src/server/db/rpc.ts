import type { SupabaseClient } from "@shared/lib/supabase"
import { ValidationError } from "./errors"

export type CreateWorkspaceInput = { name: string; title: string; goal: string }

/**
 * POST /api/v1/workspaces wraps the `create_workspace` definer RPC (DB-Q6) — it never reimplements the
 * team + board + column + session transaction that migration 0004 already runs. Placement: spec §4.2 lists no
 * workspace package, and this is a database-function wrapper, so it lives with the other db seam members.
 */
export async function createWorkspace(db: SupabaseClient, input: CreateWorkspaceInput): Promise<{ id: string }> {
  const name = input.name?.trim()
  const title = input.title?.trim()
  const goal = input.goal?.trim()
  if (!name || !title || !goal) throw new ValidationError("name, title and goal are required")
  const { data, error } = await db.rpc("create_workspace", { p_name: name, p_title: title, p_goal: goal })
  if (error) throw error
  return { id: data as string }
}
