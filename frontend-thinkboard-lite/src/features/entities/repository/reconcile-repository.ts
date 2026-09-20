import Dexie from "dexie"
import { getDb } from "../db"

export interface LocalManifestRow {
  id: string
  updatedAt: string
  pending: boolean // a local change not yet pushed: reconcile never deletes or overwrites it (RULE-13)
}

export async function artifactIdsForSession(sessionId: string): Promise<string[]> {
  return (await getDb().artifacts.where("sessionId").equals(sessionId).primaryKeys()) as string[]
}

/** What Dexie holds for the reconcile scope: the highlights of these artifacts, or the notes of those highlights (F8). */
export async function localManifest(table: "highlights" | "notes", artifactIds: string[]): Promise<LocalManifestRow[]> {
  const db = getDb()
  const highlights = (
    await Promise.all(
      artifactIds.map((aid) => db.highlights.where("[artifactId+page]").between([aid, Dexie.minKey], [aid, Dexie.maxKey], true, true).toArray())
    )
  ).flat()
  const rows = table === "highlights" ? highlights : await db.notes.where("highlightId").anyOf(highlights.map((h) => h.id)).toArray()
  return rows.map((r) => ({ id: r.id, updatedAt: String(r.updatedAt), pending: r._sync !== "clean" }))
}
