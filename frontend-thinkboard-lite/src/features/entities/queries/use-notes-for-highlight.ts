import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { HighlightRow, NoteRow } from "../types"

/** Every note the local database holds for a highlight (own notes, plus the group's on a shared highlight). */
export function useNotesForHighlight(highlightId: HighlightRow["id"]): NoteRow[] | undefined {
  const db = useDb()
  return useLiveQuery(() => db.notes.where("highlightId").equals(highlightId).toArray(), [db, highlightId])
}
