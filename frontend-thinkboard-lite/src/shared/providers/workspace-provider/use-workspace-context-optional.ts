"use client"

import { useContext } from "react"
import { WorkspaceContext } from "./workspace-context"
import type { WorkspaceContextValue } from "./types"

/**
 * The tolerant reader (043): for an affordance that is simply absent outside a workspace — the notes nudge — it
 * returns `null` instead of throwing, so a leaf like a capture hook can render in isolation (a unit test, a story)
 * without pretending there is no notes rail. Anything that needs the ids keeps using `useWorkspaceContext`.
 */
export function useWorkspaceContextOptional(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext)
}
