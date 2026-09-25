import type { HighlightRow, NoteRow } from "@feature/entities/types"

export type NotePanelItem = {
  id: HighlightRow["id"]
  text: string
  page: number | null
  layer: HighlightRow["layer"]
}

export type NotePanelState = {
  items: NotePanelItem[]
  selectedId: HighlightRow["id"] | null
  note: NoteRow | undefined
  open: boolean
  select: (id: HighlightRow["id"]) => void
  onOpenChange: (open: boolean) => void
}
