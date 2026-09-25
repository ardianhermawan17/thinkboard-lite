import type { Table } from "dexie"
import { getDb } from "../db"
import type { OutboxOp, OutboxTable, SyncFlag } from "../types"
import { toWire } from "../utils/mappers"
import { enqueueOp } from "./outbox-repository"

export interface WriteOptions {
  fn?: OutboxOp["fn"] // only for op = "rpc"
  payload?: OutboxOp["payload"] // default: toWire(row), or { id } for a delete
  also?: Table[] // extra tables the same transaction touches (a deleted highlight's notes ...)
  inTx?: () => Promise<unknown> // runs inside the transaction
}

/**
 * RULE-08: a client write is the row AND its outbox entry in ONE transaction, so both land or neither does.
 * The scope MUST name the outbox table: a scope that forgets it is the bug that loses a note and that mocked tests
 * cannot see. The row's `_sync` mirrors its newest op: `pending` while queued (only the push, task 007, sets `clean`).
 */
export async function writeRow(
  table: OutboxTable,
  op: OutboxOp["op"],
  row: { id: string; _sync?: SyncFlag },
  opts: WriteOptions = {}
): Promise<void> {
  const db = getDb()
  const rows = db.table(table)
  await db.transaction("rw", [rows, db.outbox, ...(opts.also ?? [])], async () => {
    if (op === "delete") await rows.delete(row.id)
    else await rows.put({ ...row, _sync: "pending" })
    await opts.inTx?.()
    await enqueueOp(db, {
      rowId: row.id,
      table,
      op,
      fn: opts.fn,
      payload: opts.payload ?? (op === "delete" ? { id: row.id } : toWire(row)),
    })
  })
}

/**
 * The batch form of `writeRow` (F5): N rows and their N outbox entries in ONE transaction, so a 40-region
 * import is one local commit, not 40. Same RULE-08 invariant — row plus outbox op, all or nothing.
 */
export async function writeRows(table: OutboxTable, op: OutboxOp["op"], rows: { id: string; _sync?: SyncFlag }[], opts: WriteOptions = {}): Promise<void> {
  if (rows.length === 0) return
  const db = getDb()
  const store = db.table(table)
  await db.transaction("rw", [store, db.outbox, ...(opts.also ?? [])], async () => {
    for (const row of rows) {
      await store.put({ ...row, _sync: "pending" })
      await enqueueOp(db, { rowId: row.id, table, op, fn: opts.fn, payload: opts.payload ?? toWire(row) })
    }
    await opts.inTx?.()
  })
}
