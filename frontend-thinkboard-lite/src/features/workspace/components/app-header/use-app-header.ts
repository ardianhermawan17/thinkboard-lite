"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { useMeta, useOutboxCount } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectMode } from "../../selectors/workspace-selectors"
import { modeChanged } from "../../stores/workspace-slice"
import type { SessionMode } from "../../types/redux"
import type { TeamMeta } from "../../types/meta"
import { META } from "../../utils/workspace-remote"
import { useSignOut } from "../auth-guard"

const subscribe = (notify: () => void) => {
  window.addEventListener("online", notify)
  window.addEventListener("offline", notify)
  return () => {
    window.removeEventListener("online", notify)
    window.removeEventListener("offline", notify)
  }
}

export function useAppHeader() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectMode)
  const { resolvedTheme, setTheme } = useTheme()
  const outbox = useOutboxCount()
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  const team = useMeta(META.team)?.value as TeamMeta | undefined
  const signOut = useSignOut()

  const pending = (outbox?.queued ?? 0) + (outbox?.failed ?? 0)
  const syncLabel = !online ? "Offline" : (outbox?.failed ?? 0) > 0 ? "Sync failed" : pending > 0 ? `${pending} pending` : "Synced"

  return {
    teamName: team?.name,
    syncLabel,
    mode,
    setMode: (next: string) => dispatch(modeChanged(next as SessionMode)),
    dark: resolvedTheme === "dark",
    setDark: (on: boolean) => setTheme(on ? "dark" : "light"),
    signOut,
  }
}
