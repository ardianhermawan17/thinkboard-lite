import { createContext } from "react"
import type { PresenceValue } from "./types"

/** 031: one provider owns the one live channel; the rail and the cursor layer both consume this value. */
export const PresenceContext = createContext<PresenceValue | null>(null)
