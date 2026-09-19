import type { RunRow, SyncFlag } from "../types"

/** Client-only fields (blueprint localFirst.localOnlyFields): they never cross into a Postgres write. */
export const LOCAL_ONLY: ReadonlySet<string> = new Set(["_sync", "seq", "state"])

/** Dexie table -> Postgres table where the names differ (blueprint localFirst.wireNames). */
const WIRE_TABLE: Record<string, string> = { notes: "highlight_notes" }
export const wireTable = (table: string): string => WIRE_TABLE[table] ?? table
const snake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const camel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
/** Postgres table -> Dexie table: the renamed ones, else camelCase (mini_conclusions -> miniConclusions). */
export const localTable = (wire: string): string => Object.entries(WIRE_TABLE).find(([, w]) => w === wire)?.[0] ?? camel(wire)
// Shallow on purpose: a jsonb value (bbox, ink) keeps its own key case.
const remap = (obj: object, rename: (key: string) => string) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [rename(k), v]))

/** Local row -> Postgres write body. With toRow, the only place the two shapes meet. */
export function toWire(row: object): Record<string, unknown> {
  return remap(Object.fromEntries(Object.entries(row).filter(([k]) => !LOCAL_ONLY.has(k))), snake)
}

/** Postgres row (a select, or a realtime record) -> local row; `sync` is set for client-written tables. */
export function toRow<R extends object>(wire: Record<string, unknown>, sync?: SyncFlag): R {
  const row = remap(wire, camel)
  return (sync ? { ...row, _sync: sync } : row) as R
}

/** A run and its children, cached as ONE `runs` row (02 §6.1: run + points + conclusions + renderings). */
export function toRunRow(
  run: Record<string, unknown>,
  children: { points: Record<string, unknown>[]; conclusions: Record<string, unknown>[]; renderings: Record<string, unknown>[] }
): RunRow {
  return {
    ...toRow<Omit<RunRow, "points" | "conclusions" | "renderings">>(run),
    points: children.points.map((p) => toRow<RunRow["points"][number]>(p)),
    conclusions: children.conclusions.map((c) => toRow<RunRow["conclusions"][number]>(c)),
    renderings: children.renderings.map((r) => toRow<RunRow["renderings"][number]>(r)),
  }
}
