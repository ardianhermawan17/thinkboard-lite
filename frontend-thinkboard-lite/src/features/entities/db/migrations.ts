import type { Dexie } from "dexie"

/** 02 §6.1, the one Dexie schema: seven tables (C1) and the compound index (C2). */
export const STORES_V1 = {
  meta: "key",
  artifacts: "id, sessionId",
  highlights: "id, [artifactId+page], layer, _sync",
  notes: "id, highlightId, profileId, _sync",
  miniConclusions: "highlightId",
  runs: "id, sessionId, ownerProfileId", // read cache: run + points + conclusions + renderings
  outbox: "++seq, rowId, table, state",
} as const

/** Any schema change is a NEW `db.version(n).stores(...).upgrade(...)` here; never edit a shipped version. */
export function migrate(db: Dexie): void {
  db.version(1).stores(STORES_V1)
}
