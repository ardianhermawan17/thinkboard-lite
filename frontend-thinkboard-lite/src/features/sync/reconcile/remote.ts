import { getSupabase } from "@shared/lib/supabase"
import type { RemoteManifestRow } from "./manifest-diff"

/** 500 rows a page (05 §2.1). The response is capped by PostgREST, so nothing here ever reads "one big select". */
export const PAGE = 500
export const MAX_PAGES = 200

type Table = "highlights" | "highlight_notes"

function query(table: Table, columns: string, artifactIds: string[]) {
  const supabase = getSupabase()
  // notes belong to an artifact through their highlight: an inner-join filter keeps the manifest server-side
  return table === "highlights"
    ? supabase.from(table).select(columns, { count: "exact" }).in("artifact_id", artifactIds)
    : supabase.from(table).select(`${columns}, highlights!inner(artifact_id)`, { count: "exact" }).in("highlights.artifact_id", artifactIds)
}

/** Every row's `id, updated_at`, paginated. `complete` is false unless what arrived equals the server's exact count (F3). */
export async function fetchManifest(table: Table, artifactIds: string[]): Promise<{ rows: RemoteManifestRow[]; complete: boolean }> {
  const rows: RemoteManifestRow[] = []
  let total: number | null = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error, count } = await query(table, "id, updated_at", artifactIds).order("id").range(page * PAGE, page * PAGE + PAGE - 1)
    if (error) throw new Error(error.message)
    total = count
    rows.push(...(data as unknown as RemoteManifestRow[]).map(({ id, updated_at }) => ({ id, updated_at })))
    if (data.length < PAGE) break
  }
  return { rows, complete: total !== null && rows.length === total }
}

// the inner-join embed (`highlights`) only scoped the query; it is not a column of the row
const strip = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== "highlights"))

/** A page of full rows, for the first-open bootstrap. Empty when there is nothing (left) to fetch. */
export async function fetchRowsPage(table: Table, artifactIds: string[], page: number): Promise<Record<string, unknown>[]> {
  if (artifactIds.length === 0) return []
  const { data, error } = await query(table, "*", artifactIds).order("id").range(page * PAGE, page * PAGE + PAGE - 1)
  if (error) throw new Error(error.message)
  return (data as unknown as Record<string, unknown>[]).map(strip)
}

export async function fetchByIds(table: Table, ids: string[]): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await getSupabase().from(table).select("*").in("id", ids.slice(i, i + 100))
    if (error) throw new Error(error.message)
    out.push(...(data as Record<string, unknown>[]))
  }
  return out
}

export async function fetchArtifacts(sessionId: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await getSupabase().from("artifacts").select("*").eq("session_id", sessionId)
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>[]
}
