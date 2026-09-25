import type { SupabaseClient } from "@shared/lib/supabase"
import { ForbiddenError, NotFoundError, ValidationError } from "../db/errors"

export type ResultScope = "individual" | "group"
export type RunMode = "planning" | "descriptive" | "visualize"

export const RUN_MODES: RunMode[] = ["planning", "descriptive", "visualize"]

export function isResultScope(value: unknown): value is ResultScope {
  return value === "individual" || value === "group"
}

export function isRunMode(value: unknown): value is RunMode {
  return typeof value === "string" && (RUN_MODES as string[]).includes(value)
}

export type RequestResultInput = { sessionId: string; scope: ResultScope; mode?: RunMode }
export type RequestResultOutput = { id: string; status: "pending" }

/**
 * The group-leader rule (D-03) lives HERE, never in the route: `can_lead_session()` is the RLS-backed check,
 * and its refusal becomes a ForbiddenError the route maps to 403. `mode` falls back to the session's own
 * `default_mode` column when the request does not name one. The run row is the only state this writes.
 */
export async function requestResult(db: SupabaseClient, input: RequestResultInput, profileId: string): Promise<RequestResultOutput> {
  const { data: session, error: sessionError } = await db.from("sessions").select("id, default_mode").eq("id", input.sessionId).single()
  if (sessionError || !session) throw new NotFoundError("workspace not found")

  const mode = input.mode ?? (session.default_mode as RunMode)
  if (!isRunMode(mode)) throw new ValidationError("invalid run mode")

  if (input.scope === "group") {
    const { data: canLead, error: leadError } = await db.rpc("can_lead_session", { target_session: input.sessionId })
    if (leadError) throw leadError
    if (!canLead) throw new ForbiddenError("only the leader can run a group result")
  }

  const { data, error } = await db
    .from("pipeline_runs")
    .insert({ session_id: input.sessionId, mode, owner_profile_id: input.scope === "group" ? null : profileId, status: "pending" })
    .select("id")
    .single()
  if (error || !data) throw error ?? new NotFoundError("run was not created")
  return { id: data.id as string, status: "pending" }
}

export type RequestMiniConclusionInput = { highlightId: string }
export type RequestMiniConclusionOutput = { status: "queued" }

/**
 * Idempotent by construction: it reads the highlight under the caller's own RLS (a private highlight is simply
 * not visible, so it becomes NotFound) and reports queued. 019 owns the debounce, the cache key and the call.
 */
export async function requestMiniConclusion(db: SupabaseClient, input: RequestMiniConclusionInput): Promise<RequestMiniConclusionOutput> {
  const { data, error } = await db.from("highlights").select("id").eq("id", input.highlightId).single()
  if (error || !data) throw new NotFoundError("highlight not found")
  return { status: "queued" }
}

export type RunEvent = { type: "snapshot" | "done"; data: unknown }

/**
 * The SSE payload behind GET /runs/:id/stream. 020 replaces this with real stage events over a detached context;
 * today it emits the run's current row once, read under the caller's RLS, then a terminal `done`.
 */
export async function* subscribeRun(db: SupabaseClient, runId: string, signal: AbortSignal): AsyncGenerator<RunEvent> {
  const { data, error } = await db.from("pipeline_runs").select("id, status, mode, owner_profile_id, started_at, finished_at").eq("id", runId).single()
  if (error || !data) throw new NotFoundError("run not found")
  if (!signal.aborted) yield { type: "snapshot", data }
  yield { type: "done", data: { id: runId } }
}
