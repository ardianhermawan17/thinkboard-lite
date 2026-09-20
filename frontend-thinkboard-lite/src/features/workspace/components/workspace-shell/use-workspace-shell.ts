"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMeta } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectError, selectProfileId, selectSessionId, selectTeamId } from "../../selectors/workspace-selectors"
import { failed, workspaceOpened } from "../../stores/workspace-slice"
import type { SessionMeta } from "../../types/meta"
import { META, createWorkspace, pullWorkspaceMeta, teamOfSession } from "../../utils/workspace-remote"

/** `/w` lands in the last workspace (RULE-14) or offers create; `/w/[id]` opens that workspace and refreshes its meta when online. */
export function useWorkspaceShell(workspaceId?: string) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const profileId = useAppSelector(selectProfileId)
  const sessionId = useAppSelector(selectSessionId)
  const teamId = useAppSelector(selectTeamId)
  const error = useAppSelector(selectError)
  const session = useMeta(META.session)?.value as SessionMeta | undefined

  useEffect(() => {
    if (!workspaceId && sessionId) router.replace(`/w/${sessionId}`)
  }, [workspaceId, sessionId, router])

  // Keyed on the workspace only: the pull below changes teamId/sessionId, which must not re-trigger it.
  useEffect(() => {
    if (!workspaceId || !profileId) return
    const cached = workspaceId === sessionId && teamId
    void (async () => {
      try {
        const team = cached || (await teamOfSession(workspaceId))
        dispatch(workspaceOpened({ teamId: team, sessionId: workspaceId }))
        await pullWorkspaceMeta(team, workspaceId, profileId)
      } catch (e) {
        // offline (or a slow network) with a cached workspace: the meta already in Dexie stays; a first open must say why it failed
        if (!cached) dispatch(failed(e instanceof Error ? e.message : "Could not open the workspace"))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, profileId])

  async function create(form: FormData) {
    try {
      const made = await createWorkspace(String(form.get("name")), String(form.get("title")), String(form.get("goal")))
      dispatch(workspaceOpened(made))
      router.push(`/w/${made.sessionId}`)
    } catch (e) {
      dispatch(failed(e instanceof Error ? e.message : "Could not create the workspace"))
    }
  }

  return { landing: !workspaceId, redirecting: !workspaceId && Boolean(sessionId), error, session, create }
}
