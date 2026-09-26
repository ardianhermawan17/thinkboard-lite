"use client"

import type { UUID } from "@shared/types/domain/common"
import { Highlighter } from "lucide-react"
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
    <div data-testid="note-panel" className="flex h-full min-h-0 flex-col border-s border-border bg-sidebar/30">
      <h2 className="border-b border-border px-3 py-2.5 text-sm font-medium tracking-tight">Notes</h2>
      {items.length === 0 ? (
        <div className="flex flex-col gap-2.5 p-4">
          <span aria-hidden className="grid size-8 place-items-center rounded-pill bg-muted text-muted-foreground">
            <Highlighter className="size-4" />
          </span>
          <p className="text-xs leading-relaxed text-muted-foreground">Select text or draw a region on the page to add a highlight and a note.</p>
        </div>
      ) : (
        <motion.ul className="flex min-h-0 flex-col gap-0.5 overflow-auto p-1.5" variants={stagger} initial="hidden" animate="show">
          {items.map((item) => (
            <motion.li key={item.id} variants={riseChild}>
              <button
                type="button"
                onClick={() => select(item.id)}
                className="w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted"
              >
                <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
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
