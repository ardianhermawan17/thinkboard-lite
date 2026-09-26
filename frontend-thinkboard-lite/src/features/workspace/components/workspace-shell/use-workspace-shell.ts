"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { META, useMeta } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectError, selectProfileId, selectSessionId, selectTeamId } from "../../selectors/workspace-selectors"
import { failed, workspaceOpened } from "../../stores/workspace-slice"
import type { SessionMeta } from "../../types/meta"
import { createWorkspace, listWorkspaces, teamOfSession, type WorkspaceSummary } from "../../utils/workspace-remote"

/** `/w` lists the workspaces you can open, lands in the last one (RULE-14) or offers create; `/w/[id]` opens that one. */
export function useWorkspaceShell(workspaceId?: string) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const profileId = useAppSelector(selectProfileId)
  const sessionId = useAppSelector(selectSessionId)
  const teamId = useAppSelector(selectTeamId)
  const error = useAppSelector(selectError)
  const session = useMeta(META.session)?.value as SessionMeta | undefined
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])

  useEffect(() => {
    if (!workspaceId && sessionId) router.replace(`/w/${sessionId}`)
  }, [workspaceId, sessionId, router])

  // The landing list. A failure (offline, or no session yet) leaves it empty: the create form is the fallback, and a
  // workspace URL still opens directly.
  useEffect(() => {
    if (workspaceId || !profileId) return
    let cancelled = false
    listWorkspaces()
      .then((rows) => {
        if (!cancelled) setWorkspaces(rows)
      })
      .catch(() => {
        if (!cancelled) setWorkspaces([])
      })
    return () => {
      cancelled = true
    }
  }, [workspaceId, profileId])

  // Keyed on the workspace only: the pull below changes teamId/sessionId, which must not re-trigger it.
  useEffect(() => {
    if (!workspaceId || !profileId) return
    const cached = workspaceId === sessionId && teamId
    void (async () => {
      try {
        const team = cached || (await teamOfSession(workspaceId))
        dispatch(workspaceOpened({ teamId: team, sessionId: workspaceId })) // the sync engine reacts: bootstrap, push, pull, subscribe
      } catch (e) {
        // offline with a cached workspace the ids are already in the store; a first open must say why it failed
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

  /** Open a workspace from the landing list. */
  const open = useCallback((id: string) => router.push(`/w/${id}`), [router])

  // profileId/sessionId are exposed so the shell can provide the shared workspace context (026) above the
  // injected document view; the values already live here, so the context adds no second source.
  return { landing: !workspaceId, redirecting: !workspaceId && Boolean(sessionId), error, session, workspaces, create, open, profileId, sessionId }
}
