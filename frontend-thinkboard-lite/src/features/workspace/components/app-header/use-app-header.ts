"use client"

import { useTheme } from "next-themes"
import { META, useMeta } from "@feature/entities"
import { selectManualOffline } from "@feature/sync/selectors/sync-selectors"
import { manualOfflineSet } from "@feature/sync/stores/sync-slice"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectMode } from "../../selectors/workspace-selectors"
import { modeChanged, tourReset } from "../../stores/workspace-slice"
import type { SessionMode } from "../../types/redux"
import type { TeamMeta } from "../../types/meta"
import { useSignOut } from "../auth-guard"

export function useAppHeader() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectMode)
  const offline = useAppSelector(selectManualOffline)
  const { resolvedTheme, setTheme } = useTheme()
  const team = useMeta(META.team)?.value as TeamMeta | undefined
  const signOut = useSignOut()

  return {
    teamName: team?.name,
    mode,
    setMode: (next: string) => dispatch(modeChanged(next as SessionMode)),
    offline,
    // g1: the manual Work-offline switch is authoritative; the banner is the only way back.
    setOffline: (on: boolean) => dispatch(manualOfflineSet(on)),
    dark: resolvedTheme === "dark",
    setDark: (on: boolean) => setTheme(on ? "dark" : "light"),
    // 043: a way to walk the tour again.
    showTour: () => dispatch(tourReset()),
    signOut,
  }
}
