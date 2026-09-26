"use client"

import { useCallback, useMemo, useState } from "react"
import type { WorkspaceContextValue } from "./types"

/**
 * The provider's state (I2: a .tsx with a sibling use-*.ts keeps no hooks of its own).
 *
 * `page` is mirrored from the document view so presence can read it without importing the viewport slice; the two
 * rail flags live here for the same reason (043) — the shell owns the people rail, the document view owns the notes
 * rail, and a feature may not read another feature's slice (I3). They are deliberately not persisted: a fresh visit
 * opens with both rails showing.
 */
export function useWorkspaceProvider({ profileId, sessionId }: Pick<WorkspaceContextValue, "profileId" | "sessionId">): WorkspaceContextValue {
  const [page, setPage] = useState(1)
  const [notesVisible, setNotesVisibleState] = useState(true)
  const [peopleVisible, setPeopleVisibleState] = useState(true)
  const reportPage = useCallback((next: number) => setPage(next), [])
  const setNotesVisible = useCallback((visible: boolean) => setNotesVisibleState(visible), [])
  const setPeopleVisible = useCallback((visible: boolean) => setPeopleVisibleState(visible), [])
  return useMemo(
    () => ({ profileId, sessionId, page, reportPage, notesVisible, setNotesVisible, peopleVisible, setPeopleVisible }),
    [profileId, sessionId, page, reportPage, notesVisible, setNotesVisible, peopleVisible, setPeopleVisible]
  )
}
