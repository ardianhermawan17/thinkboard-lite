import { liveQuery } from "dexie"
import { getDb, type ThinkboardDb } from "../db"
import type { OutboxOp } from "../types"
import { coalesce, type NewOp } from "../utils/coalesce"

const MIRRORED = new Set(["highlights", "notes", "artifacts"])
const mirrored = (table: string) => MIRRORED.has(table)

/** Adds an op, coalescing it into the row's queued op when it can (RULE-11). Runs INSIDE the caller's transaction. */
export async function enqueueOp(db: ThinkboardDb, next: NewOp): Promise<void> {
  const prior = await db.outbox
    .where("rowId")
    .equals(next.rowId)
    .and((o) => o.table === next.table && o.state === "queued")
    .last()
  const c = coalesce(prior, next)
  if (c.kind === "cancel") return void (await db.outbox.delete(c.seq))
  if (c.kind === "merge") return void (await db.outbox.update(c.seq, { op: c.op, payload: c.payload }))
  await db.outbox.add({ ...next, state: "queued", attempts: 0 })
}

/** A write to a non-mirrored row (a persona, a leadership transfer): the optimistic `meta` value and its op, in ONE transaction. */
export async function putMetaAndEnqueue(key: string, value: unknown, op: NewOp): Promise<void> {
  const db = getDb()
  await db.transaction("rw", [db.meta, db.outbox], async () => {
    await db.meta.put({ key, value })
    await enqueueOp(db, op)
  })
}

/** The drain's head: the lowest `seq` that is still queued. A parked op is skipped, never retried (F1). */
export function nextQueuedOp(): Promise<OutboxOp | undefined> {
  return getDb().outbox.where("state").equals("queued").first()
}

/** The server confirmed the op: it leaves the outbox, and the row is `clean` once no other op of it is left (F2). */
export async function confirmOp(op: OutboxOp): Promise<void> {
  const db = getDb()
  const rows = mirrored(op.table) && op.op !== "delete" ? db.table(op.table) : null
  await db.transaction("rw", rows ? [db.outbox, rows] : [db.outbox], async () => {
    await db.outbox.delete(op.seq)
    if (rows && (await db.outbox.where("rowId").equals(op.rowId).count()) === 0) await rows.update(op.rowId, { _sync: "clean" })
  })
}

export async function bumpAttempts(op: OutboxOp, message: string): Promise<void> {
  await getDb().outbox.update(op.seq, { attempts: op.attempts + 1, lastError: message })
}

/**
 * A 4xx: park the op (RULE-12) and everything that cannot succeed without it (F1): later ops of the same row and, for a
 * parked highlight, the notes hanging off it. Their rows go `failed` (F2) so the UI can say so and `apply-remote` stops skipping them.
 */
export async function parkOp(op: OutboxOp, message: string): Promise<OutboxOp[]> {
  const db = getDb()
  return db.transaction("rw", [db.outbox, db.highlights, db.notes, db.artifacts], async () => {
    const victims = await db.outbox
      .where("state")
      .equals("queued")
      .and((o) => o.seq === op.seq || o.rowId === op.rowId || (op.table === "highlights" && o.table === "notes" && o.payload.highlight_id === op.rowId))
      .toArray()
    const parked: OutboxOp[] = []
    for (const v of victims) {
      const lastError = v.seq === op.seq ? message : `parked behind op ${op.seq}: ${message}`
      await db.outbox.update(v.seq, { state: "failed", lastError })
      if (mirrored(v.table) && v.op !== "delete") await db.table(v.table).update(v.rowId, { _sync: "failed" })
      parked.push({ ...v, state: "failed", lastError })
    }
    return parked
  })
}

/** Calls back with the number of queued ops whenever it changes (the engine drains on a rise). Returns the unsubscribe. */
export function watchQueuedOps(onCount: (queued: number) => void): () => void {
  const db = getDb()
  const sub = liveQuery(() => db.outbox.where("state").equals("queued").count()).subscribe({ next: onCount })
  return () => sub.unsubscribe()
}
