"use client"

import Dexie, { type EntityTable } from "dexie"
import type { ArtifactRow, HighlightRow, MetaRow, MiniConclusionRow, NoteRow, OutboxOp, RunRow } from "../types"
import { migrate } from "./migrations"

export type ThinkboardDb = Dexie & {
  meta: EntityTable<MetaRow, "key">
  artifacts: EntityTable<ArtifactRow, "id">
  highlights: EntityTable<HighlightRow, "id">
  notes: EntityTable<NoteRow, "id">
  miniConclusions: EntityTable<MiniConclusionRow, "highlightId">
  runs: EntityTable<RunRow, "id">
  outbox: EntityTable<OutboxOp, "seq">
}

/** Per-profile (DB-Q3): a second account on the same browser never reads the first one's rows. */
export const dbName = (profileId: string): string => `thinkboard:${profileId}`

export function createDb(profileId: string): ThinkboardDb {
  const db = new Dexie(dbName(profileId)) as ThinkboardDb
  migrate(db)
  return db
}
