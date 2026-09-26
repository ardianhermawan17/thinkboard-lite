"use client"

import { useContext } from "react"
import { PresenceContext } from "./presence-context"
import type { PresenceValue } from "./types"

/** Throws outside a provider rather than opening a second channel or returning a wrong default. */
export function usePresenceContext(): PresenceValue {
  const value = useContext(PresenceContext)
  if (!value) throw new Error("usePresenceContext must be used inside <PresenceProvider>")
  return value
}
