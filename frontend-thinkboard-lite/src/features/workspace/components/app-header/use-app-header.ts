"use client"

import { useTheme } from "next-themes"
import { META, useMeta } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectMode } from "../../selectors/workspace-selectors"
import { modeChanged } from "../../stores/workspace-slice"
import type { SessionMode } from "../../types/redux"
import type { TeamMeta } from "../../types/meta"
import { useSignOut } from "../auth-guard"

export function useAppHeader() {
  const dispatch = useAppDispatch()
  const mode = useAppSelector(selectMode)
  const { resolvedTheme, setTheme } = useTheme()
  const team = useMeta(META.team)?.value as TeamMeta | undefined
  const signOut = useSignOut()

  return {
    teamName: team?.name,
    mode,
    setMode: (next: string) => dispatch(modeChanged(next as SessionMode)),
    dark: resolvedTheme === "dark",
    setDark: (on: boolean) => setTheme(on ? "dark" : "light"),
    signOut,
  }
}
