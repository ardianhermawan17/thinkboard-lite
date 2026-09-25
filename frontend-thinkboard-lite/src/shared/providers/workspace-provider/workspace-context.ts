import { createContext } from "react"
import type { WorkspaceContextValue } from "./types"

/**
 * 026: the seam that hands the signed-in profile and the open session to any feature. It is defined in
 * `shared/` on purpose — a feature may not import another feature (I3), and `src/app/` may not read the store
 * (I4), so this is the only place both sides can agree on.
 */
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)
