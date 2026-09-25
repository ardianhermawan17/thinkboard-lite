import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { ArtifactRow, NoteRow } from "../types"

/**
 * Every note on the session's highlights, for the export bundle (027). Mirrors use-highlights-for-session:
 * resolve the session's artifacts, then their highlights, then their notes. Small sets; no index needed.
 */
export function useNotesForSession(sessionId: ArtifactRow["sessionId"]): NoteRow[] | undefined {
  const db = useDb()
  return useLiveQuery(async () => {
    const artifacts = await db.artifacts.where("sessionId").equals(sessionId).toArray()
    if (artifacts.length === 0) return []
    const artifactIds = new Set(artifacts.map((artifact) => artifact.id))
    const highlights = await db.highlights.filter((highlight) => artifactIds.has(highlight.artifactId)).toArray()
    if (highlights.length === 0) return []
    const highlightIds = new Set(highlights.map((highlight) => highlight.id))
    return db.notes.filter((note) => highlightIds.has(note.highlightId)).toArray()
  }, [db, sessionId])
}
