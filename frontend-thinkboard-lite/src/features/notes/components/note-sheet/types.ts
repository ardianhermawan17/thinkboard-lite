import type { HighlightRow, NoteRow } from "@feature/entities/types"
import type { UUID } from "@shared/types/domain/common"

export type NoteSheetProps = {
  highlightId: HighlightRow["id"]
  profileId: UUID<"profiles">
  note: NoteRow | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}
