import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { ArtifactRow } from "../types"

/** The artifacts (main PDF, note copy) of a workspace session. */
export function useArtifactsForSession(sessionId: ArtifactRow["sessionId"]): ArtifactRow[] | undefined {
  const db = useDb()
  return useLiveQuery(() => db.artifacts.where("sessionId").equals(sessionId).toArray(), [db, sessionId])
}
