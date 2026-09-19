import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { HighlightRow, MiniConclusionRow } from "../types"

/** The model's short conclusion for a highlight; it arrives from the server, so it can be absent. */
export function useMiniConclusionForHighlight(highlightId: HighlightRow["id"]): MiniConclusionRow | undefined {
  const db = useDb()
  return useLiveQuery(() => db.miniConclusions.get(highlightId), [db, highlightId])
}
