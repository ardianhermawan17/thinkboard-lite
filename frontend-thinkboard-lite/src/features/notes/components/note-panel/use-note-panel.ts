"use client"

import { useCallback, useState } from "react"
import { useHighlightsForSession } from "@feature/entities/queries/use-highlights-for-session"
import { useNotesForHighlight } from "@feature/entities/queries/use-notes-for-highlight"
import type { ArtifactRow, HighlightRow } from "@feature/entities/types"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import type { NotePanelState } from "./types"

/**
 * g3: lists a session's highlights and opens 012's note sheet for the one selected. It reads `profileId` from
 * the shared workspace context (026) — not from `features/workspace` (I3) and not from a store hook in the app
 * route (I4). Selecting from a list also avoids making the highlight marks clickable, which would fight z1 text
 * selection (010).
 */
export function useNotePanel(): NotePanelState {
  const { profileId, sessionId } = useWorkspaceContext()
  const highlights = useHighlightsForSession((sessionId ?? "") as ArtifactRow["sessionId"])
  const [selectedId, setSelectedId] = useState<HighlightRow["id"] | null>(null)
  const notes = useNotesForHighlight(selectedId ?? ("" as HighlightRow["id"]))

  const select = useCallback((id: HighlightRow["id"]) => setSelectedId(id), [])
  const onOpenChange = useCallback((open: boolean) => {
    if (!open) setSelectedId(null)
  }, [])

  // The author's own note first (that is what the editor writes); a teammate's note is the fallback on a group highlight.
  const note = notes?.find((candidate) => candidate.profileId === profileId) ?? notes?.[0]

  return {
    items: (highlights ?? []).map((highlight) => ({ id: highlight.id, text: highlight.text, page: highlight.page, layer: highlight.layer })),
    selectedId,
    note,
    open: selectedId !== null,
    select,
    onOpenChange,
  }
}
