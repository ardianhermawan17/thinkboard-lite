import type { RemoteEvent } from "@feature/entities"

type Table = "highlights" | "highlight_notes"

export interface BootstrapDeps {
  isDone(sessionId: string): Promise<boolean>
  markDone(sessionId: string): Promise<void>
  artifactIds(sessionId: string): Promise<string[]> // what Dexie already knows
  fetchArtifacts(sessionId: string): Promise<Record<string, unknown>[]>
  fetchRowsPage(table: Table, artifactIds: string[], page: number): Promise<Record<string, unknown>[]>
  apply(events: RemoteEvent[]): Promise<void>
  pageSize: number
}

/**
 * 05 §2.1, first open of a workspace on this device. Paginated, one batch (one transaction) per page, and the `bootstrapped:`
 * flag is written LAST: an interrupted bootstrap has no flag, so the next open starts again, and the batches are upserts
 * (a dirty local row is never overwritten), so starting again is safe. Returns the artifact ids the reconcile scopes to.
 */
export async function bootstrapWorkspace(deps: BootstrapDeps, sessionId: string): Promise<string[]> {
  if (await deps.isDone(sessionId)) return deps.artifactIds(sessionId)

  const artifacts = await deps.fetchArtifacts(sessionId)
  await deps.apply(artifacts.map((record): RemoteEvent => ({ type: "INSERT", table: "artifacts", record, oldRecord: null })))
  const artifactIds = artifacts.map((a) => a.id as string)

  for (const table of ["highlights", "highlight_notes"] as const) {
    for (let page = 0; ; page++) {
      const rows = await deps.fetchRowsPage(table, artifactIds, page)
      await deps.apply(rows.map((record): RemoteEvent => ({ type: "INSERT", table, record, oldRecord: null })))
      if (rows.length < deps.pageSize) break
    }
  }
  await deps.markDone(sessionId)
  return artifactIds
}
