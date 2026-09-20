import type { LocalManifestRow, RemoteEvent } from "@feature/entities"

export interface RemoteManifestRow {
  id: string
  updated_at: string
}

export interface ManifestDiff {
  stale: string[] // remote is newer than local: refetch
  missing: string[] // remote has it, local does not: fetch
  gone: string[] // local has it, remote does not: it was deleted or un-shared while offline
}

const time = (iso: string) => Date.parse(iso)

/** Pure. A row with an unsent local change (`pending`) is never refetched and never deleted: the push settles it first (RULE-13). */
export function diffManifest(local: LocalManifestRow[], remote: RemoteManifestRow[]): ManifestDiff {
  const remoteAt = new Map(remote.map((r) => [r.id, r.updated_at]))
  const localIds = new Set(local.map((l) => l.id))
  return {
    stale: local.filter((l) => !l.pending && remoteAt.has(l.id) && time(remoteAt.get(l.id)!) > time(l.updatedAt)).map((l) => l.id),
    missing: remote.filter((r) => !localIds.has(r.id)).map((r) => r.id),
    gone: local.filter((l) => !l.pending && !remoteAt.has(l.id)).map((l) => l.id),
  }
}

type Table = "highlights" | "highlight_notes"

export interface ReconcileDeps {
  /** `complete` is false when the page cap was hit or the rows fetched do not add up to the server's count (F3). */
  fetchManifest(table: Table, artifactIds: string[]): Promise<{ rows: RemoteManifestRow[]; complete: boolean }>
  fetchByIds(table: Table, ids: string[]): Promise<Record<string, unknown>[]>
  local(table: "highlights" | "notes", artifactIds: string[]): Promise<LocalManifestRow[]>
  apply(events: RemoteEvent[]): Promise<void>
}

export interface ReconcileResult {
  fetched: number
  deleted: number
  incomplete: Table[] // tables whose manifest was not complete: nothing was deleted from them
}

/**
 * 05 §2.4: everything that happened while this device was away. One manifest per client-written mirror (F8), each paginated;
 * `gone` is computed only from a COMPLETE manifest (F3), so a capped page can never delete a real row.
 */
export async function reconcile(deps: ReconcileDeps, artifactIds: string[]): Promise<ReconcileResult> {
  const result: ReconcileResult = { fetched: 0, deleted: 0, incomplete: [] }
  if (artifactIds.length === 0) return result

  for (const [remoteTable, localTable] of [["highlights", "highlights"], ["highlight_notes", "notes"]] as const) {
    const manifest = await deps.fetchManifest(remoteTable, artifactIds)
    const diff = diffManifest(await deps.local(localTable, artifactIds), manifest.rows)
    if (!manifest.complete) result.incomplete.push(remoteTable)
    const gone = manifest.complete ? diff.gone : []

    const ids = [...diff.stale, ...diff.missing]
    const rows = ids.length > 0 ? await deps.fetchByIds(remoteTable, ids) : []
    const events: RemoteEvent[] = [
      ...rows.map((record): RemoteEvent => ({ type: "INSERT", table: remoteTable, record, oldRecord: null })),
      ...gone.map((id): RemoteEvent => ({ type: "DELETE", table: remoteTable, record: null, oldRecord: { id } })),
    ]
    await deps.apply(events) // one transaction per table
    result.fetched += rows.length
    result.deleted += gone.length
  }
  return result
}
