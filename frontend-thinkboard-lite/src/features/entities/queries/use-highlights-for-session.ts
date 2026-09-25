import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { ArtifactRow, HighlightRow } from "../types"

/**
 * Every highlight across a session's artifacts, for views that need the whole workspace rather than one page
 * (026's note panel, 016's export). `highlights` has no plain `artifactId` index (db/migrations.ts), so this
 * filters the table; a workspace's highlight set is small (hundreds).
 */
export function useHighlightsForSession(sessionId: ArtifactRow["sessionId"]): HighlightRow[] | undefined {
  const db = useDb()
  return useLiveQuery(async () => {
    const artifacts = await db.artifacts.where("sessionId").equals(sessionId).toArray()
    if (artifacts.length === 0) return []
    const ids = new Set(artifacts.map((artifact) => artifact.id))
    return db.highlights.filter((highlight) => ids.has(highlight.artifactId)).toArray()
  }, [db, sessionId])
}
