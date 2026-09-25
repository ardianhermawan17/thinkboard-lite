"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shared/components/ui/sheet"
import { NoteEditor } from "../note-editor"
import { WritingCheck } from "../writing-check"
import type { NoteSheetProps } from "./types"

/**
 * g3/I27: `SheetContent` renders through a Radix `Portal` at the document root — its own stacking
 * context — with an opaque `bg-popover`, so a pen writing into the note textarea never lands on the
 * Konva Stage beneath. The composing document view is expected to pass `interactive={!open}` to its
 * `PageStage` (page-stage `types.ts`), disabling the Stage's pointer events for as long as this is open.
 */
export function NoteSheet({ highlightId, profileId, note, open, onOpenChange }: NoteSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Note</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 p-4">
          <WritingCheck />
          <NoteEditor highlightId={highlightId} profileId={profileId} note={note} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
