import type { HighlightRow, NoteRow } from "@feature/entities/types"
import type { UUID } from "@shared/types/domain/common"

export type NoteEditorProps = {
  highlightId: HighlightRow["id"]
  profileId: UUID<"profiles">
  /** This profile's own note on the highlight, or undefined if none exists yet (the first edit creates it). */
  note: NoteRow | undefined
}
