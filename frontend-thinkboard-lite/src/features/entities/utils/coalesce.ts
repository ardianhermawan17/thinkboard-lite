import type { OutboxOp } from "../types"

export type NewOp = Pick<OutboxOp, "rowId" | "table" | "op" | "fn" | "payload">

export type CoalesceResult =
  | { kind: "add" }
  | { kind: "merge"; seq: number; op: OutboxOp["op"]; payload: Record<string, unknown> }
  | { kind: "cancel"; seq: number }

/**
 * RULE-11: at most one queued op per row, so a typed paragraph is one write, not 200. `prior` is the row's newest QUEUED
 * op (a parked op is never touched). insert+update = one insert with the newer body; update+update = one update;
 * insert+delete = nothing was ever sent, both vanish; update+delete = one delete. An rpc is never merged.
 */
export function coalesce(prior: OutboxOp | undefined, next: NewOp): CoalesceResult {
  if (!prior || prior.state !== "queued" || prior.table !== next.table || prior.op === "rpc" || next.op === "rpc") return { kind: "add" }
  if (next.op === "update" && (prior.op === "insert" || prior.op === "update")) {
    return { kind: "merge", seq: prior.seq, op: prior.op, payload: { ...prior.payload, ...next.payload } }
  }
  if (next.op === "delete" && prior.op === "insert") return { kind: "cancel", seq: prior.seq }
  if (next.op === "delete" && prior.op === "update") return { kind: "merge", seq: prior.seq, op: "delete", payload: next.payload }
  return { kind: "add" }
}
