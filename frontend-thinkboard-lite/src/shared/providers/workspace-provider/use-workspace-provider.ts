"use client"

import { useCallback, useMemo, useState } from "react"
import type { WorkspaceContextValue } from "./types"

/**
 * 033: the provider's state lives here (I2: a .tsx with a sibling use-*.ts keeps no hooks of its own). The page is
 * mirrored from the document view so presence can read it without importing the viewport slice.
 */
export function useWorkspaceProvider({ profileId, sessionId }: Pick<WorkspaceContextValue, "profileId" | "sessionId">): WorkspaceContextValue {
  const [page, setPage] = useState(1)
  const reportPage = useCallback((next: number) => setPage(next), [])
  return useMemo(() => ({ profileId, sessionId, page, reportPage }), [profileId, sessionId, page, reportPage])
}
