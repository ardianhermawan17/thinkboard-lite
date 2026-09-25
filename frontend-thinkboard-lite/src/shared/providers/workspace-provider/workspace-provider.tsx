"use client"

import type { ReactNode } from "react"
import { WorkspaceContext } from "./workspace-context"
import type { WorkspaceContextValue } from "./types"

/** Provided by the workspace shell, above the injected document view; consumers are features (I3-safe). */
export function WorkspaceProvider({ profileId, sessionId, children }: WorkspaceContextValue & { children: ReactNode }) {
  return <WorkspaceContext.Provider value={{ profileId, sessionId }}>{children}</WorkspaceContext.Provider>
}
