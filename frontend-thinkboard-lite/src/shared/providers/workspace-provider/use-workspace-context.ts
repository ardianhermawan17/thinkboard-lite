"use client"

import { useContext } from "react"
import { WorkspaceContext } from "./workspace-context"
import type { WorkspaceContextValue } from "./types"

/** The consumer side of the seam. Throws outside a `WorkspaceProvider` rather than returning a wrong default. */
export function useWorkspaceContext(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error("useWorkspaceContext must be used inside <WorkspaceProvider>")
  return value
}
