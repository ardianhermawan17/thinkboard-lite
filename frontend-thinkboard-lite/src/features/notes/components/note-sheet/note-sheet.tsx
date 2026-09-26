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
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Highlight note</p>
          <SheetTitle>Note</SheetTitle>
        </SheetHeader>
        {/* The body scrolls on its own, so a long note never pushes the sheet past the viewport. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <WritingCheck />
          <NoteEditor highlightId={highlightId} profileId={profileId} note={note} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
