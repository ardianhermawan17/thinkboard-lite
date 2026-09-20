import { wireTable, type OutboxOp } from "@feature/entities"
import { getSupabase } from "@shared/lib/supabase"
import type { SendResult } from "./backoff"

/** One op to PostgREST under the user's JWT: RLS is the authorization, so a write a policy forbids comes back 403 and parks. */
export async function sendOp(op: OutboxOp): Promise<SendResult> {
  const supabase = getSupabase()
  const table = wireTable(op.table)
  const res =
    op.op === "rpc"
      ? await supabase.rpc(op.fn as string, op.payload)
      : op.op === "delete"
        ? await supabase.from(table).delete().eq("id", op.rowId)
        : await supabase.from(table).upsert(op.payload, { onConflict: "id" }) // idempotent: a crash mid-drain never duplicates
  return { status: res.status, error: res.error }
}

export async function refreshAuth(): Promise<boolean> {
  const { error } = await getSupabase().auth.refreshSession()
  return !error
}
