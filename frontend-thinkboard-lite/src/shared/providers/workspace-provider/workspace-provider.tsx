"use client"

import type { ReactNode } from "react"
import { WorkspaceContext } from "./workspace-context"
import { useWorkspaceProvider } from "./use-workspace-provider"
import type { WorkspaceContextValue } from "./types"

type WorkspaceProviderProps = Pick<WorkspaceContextValue, "profileId" | "sessionId"> & { children: ReactNode }

/**
 * Provided by the workspace shell, above the injected document view; consumers are features (I3-safe).
 * 033: it also mirrors the document view's current page. The viewport slice is the source, but presence may not
 * read it (a feature may not import another feature) and `src/app/` may not read the store (I4), so the document
 * view reports the page here and presence reads it — the same seam 026 opened for the ids.
 */
export function WorkspaceProvider({ profileId, sessionId, children }: WorkspaceProviderProps) {
  const value = useWorkspaceProvider({ profileId, sessionId })
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
