import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { ArtifactRow, HighlightRow } from "../types"

/** The highlights on one page of an artifact: the hot path, served by the [artifactId+page] index. */
export function useHighlightsForPage(artifactId: ArtifactRow["id"], page: number): HighlightRow[] | undefined {
  const db = useDb()
  return useLiveQuery(() => db.highlights.where("[artifactId+page]").equals([artifactId, page]).toArray(), [db, artifactId, page])
}
