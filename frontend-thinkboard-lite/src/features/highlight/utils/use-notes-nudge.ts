"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { useWorkspaceContextOptional } from "@shared/providers/workspace-provider"

/**
 * 043: a highlight is written where the notes rail would show it. When that rail is hidden (full-page reading), the
 * mark should not land silently — this says where it went and offers to open the rail. It only speaks while the rail
 * is hidden, so the common case stays quiet, and it stays silent outside a workspace (no provider, no rail to open).
 */
export function useNotesNudge() {
  const workspace = useWorkspaceContextOptional()
  const notesVisible = workspace?.notesVisible ?? true
  const setNotesVisible = workspace?.setNotesVisible

  return useCallback(
    (text: string) => {
      if (notesVisible || !setNotesVisible) return
      toast("Highlight added to Notes", {
        description: text ? text.slice(0, 60) : "Open the notes rail to write about it.",
        action: { label: "Show notes", onClick: () => setNotesVisible(true) },
      })
    },
    [notesVisible, setNotesVisible]
  )
}
