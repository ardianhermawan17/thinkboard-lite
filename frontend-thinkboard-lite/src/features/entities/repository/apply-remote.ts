import { getDb, type ThinkboardDb } from "../db"
import type { HighlightRow } from "../types"
import { localTable, toRow, toRunRow } from "../utils/mappers"

/** What features/sync/realtime/handlers.ts (task 007) turns a broadcast payload into. */
export interface RemoteEvent {
  type: "INSERT" | "UPDATE" | "DELETE" | "RETRACT"
  table: string // the Postgres table, e.g. "highlight_notes"
  record: Record<string, unknown> | null // null on a DELETE (F7) and on a RETRACT
  oldRecord: Record<string, unknown> | null
}

// the client-written mirrors carry `_sync`; mini_conclusions are server-owned and keyed by highlightId
const WITH_SYNC = new Set(["highlights", "notes", "artifacts"])

/**
 * A remote change lands WITHOUT an outbox entry (04 rule 5: it must never be echoed back to the server), and the
 * transaction scope leaves the outbox table out on purpose, so an accidental outbox write throws.
 */
export async function applyRemote(event: RemoteEvent, myProfileId: string): Promise<void> {
  await applyRemoteBatch([event], myProfileId)
}

/** F5: a burst (a leader import is ~80 broadcasts) is ONE transaction and one live-query re-run, not one per message. */
export async function applyRemoteBatch(events: RemoteEvent[], myProfileId: string): Promise<void> {
  if (events.length === 0) return
  const db = getDb()
  await db.transaction("rw", [db.highlights, db.notes, db.artifacts, db.miniConclusions], async () => {
    for (const event of events) await applyOne(db, event, myProfileId)
  })
}

async function applyOne(db: ThinkboardDb, event: RemoteEvent, myProfileId: string): Promise<void> {
  const name = localTable(event.table)
  if (!WITH_SYNC.has(name) && name !== "miniConclusions") return // meta and runs are filled by the sync engine
  const source = event.record ?? event.oldRecord // F7: `record` is null on a delete
  if (!source) return
  const rows = db.table(name)

  if (event.type === "INSERT" || event.type === "UPDATE") {
    if (!event.record) return
    if (name === "miniConclusions") return void (await rows.put(toRow(event.record)))
    const local = await rows.get(event.record.id as string)
    if (local && local._sync !== "clean") return // an unsent local change wins; the push settles it
    await rows.put(toRow(event.record, "clean"))
    return
  }

  // DELETE, or RETRACT: the row just became private (DB-F8), so it goes unless it is mine
  if (event.type === "RETRACT" && source.profile_id === myProfileId) return
  if (name === "miniConclusions") return void (await rows.delete(source.highlight_id as string))
  await rows.delete(source.id as string)
  if (name === "highlights") {
    // the rows hanging off a highlight go with it
    await db.notes.where("highlightId").equals(source.id as string).delete()
    await db.miniConclusions.delete(source.id as HighlightRow["id"])
  }
}

/** A finished run and its children (fetched by run_id) into the `runs` read cache. Server-owned: no outbox. */
export async function applyRun(
  run: Record<string, unknown>,
  children: { points: Record<string, unknown>[]; conclusions: Record<string, unknown>[]; renderings: Record<string, unknown>[] }
): Promise<void> {
  await getDb().runs.put(toRunRow(run, children))
}
