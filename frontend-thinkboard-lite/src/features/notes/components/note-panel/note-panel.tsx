"use client"

import type { UUID } from "@shared/types/domain/common"
import { motion, riseChild, stagger } from "@shared/lib/motion"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import { NoteSheet } from "../note-sheet"
import { ReimportReview } from "../reimport-review"
import { useNotePanel } from "./use-note-panel"

/** g3: the notes rail beside the document. A container leaf — its hook owns the selection; it renders no state. */
export function NotePanel() {
  const { profileId } = useWorkspaceContext()
  const { items, selectedId, note, open, select, onOpenChange } = useNotePanel()

  return (
    <div data-testid="note-panel" className="flex h-full min-h-0 flex-col border-l">
      <h2 className="border-b px-3 py-2 text-sm font-medium">Notes</h2>
      {items.length === 0 ? (
        <p className="p-3 text-xs text-muted-foreground">Select text or draw a region on the page to add a highlight and a note.</p>
      ) : (
        <motion.ul className="flex min-h-0 flex-col overflow-auto" variants={stagger} initial="hidden" animate="show">
          {items.map((item) => (
            <motion.li key={item.id} variants={riseChild}>
              <button type="button" onClick={() => select(item.id)} className="w-full px-3 py-2 text-left text-xs hover:bg-muted">
                <span className="text-muted-foreground">
                  p.{item.page ?? "?"} · {item.layer}
                </span>
                <span className="block truncate">{item.text || "(no text)"}</span>
              </button>
            </motion.li>
          ))}
        </motion.ul>
      )}
      {selectedId && profileId && <NoteSheet highlightId={selectedId} profileId={profileId as UUID<"profiles">} note={note} open={open} onOpenChange={onOpenChange} />}
      {/* 029: re-import a bundle's notes. */}
      <ReimportReview />
    </div>
  )
}
