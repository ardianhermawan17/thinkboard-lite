/**
 * The client tables whose writes go through the outbox. 02 §6.1 lists highlights and notes and says the union "widens
 * if DB-Q12 routes other client writes through the outbox"; artifact metadata is a client write too (02 §6), so it is
 * here. Defaulted, recorded in analyze.json.
 */
export type OutboxTable = "highlights" | "notes" | "artifacts"

/** 02 §6.1. `seq` is the autoincrement drain order (RULE-10); `payload` is toWire() output, never a local row. */
export interface OutboxOp {
  seq: number
  rowId: string // uuidv7, client-generated (RULE-09)
  table: OutboxTable // the Dexie name; the push maps it with wireTable()
  op: "insert" | "update" | "delete" | "rpc"
  fn?: "promote_highlight" // only when op = "rpc"
  payload: Record<string, unknown>
  state: "queued" | "failed" // failed = parked 4xx (RULE-12); the drain skips it
  attempts: number
  lastError?: string
}
