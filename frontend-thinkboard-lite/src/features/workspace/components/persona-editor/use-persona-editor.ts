"use client"

import { useMeta } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectProfileId, selectSessionId, selectTeamId } from "../../selectors/workspace-selectors"
import { failed } from "../../stores/workspace-slice"
import type { MemberMeta, TeamPersonaMeta, UserPersonaMeta } from "../../types/meta"
import { META, pullWorkspaceMeta, saveTeamPersona, saveUserPersona } from "../../utils/workspace-remote"

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim()

export function usePersonaEditor() {
  const dispatch = useAppDispatch()
  const me = useAppSelector(selectProfileId)
  const teamId = useAppSelector(selectTeamId)
  const sessionId = useAppSelector(selectSessionId)
  const members = (useMeta(META.members)?.value ?? []) as MemberMeta[]
  const teamPersona = (useMeta(META.teamPersona)?.value ?? null) as TeamPersonaMeta | null
  const userPersona = (useMeta(META.userPersona)?.value ?? null) as UserPersonaMeta | null
  const iAmLeader = members.some((m) => m.profile_id === me && m.role === "leader")

  async function run(save: () => Promise<void>) {
    if (!me || !teamId || !sessionId) return
    try {
      await save()
      await pullWorkspaceMeta(teamId, sessionId, me)
    } catch (e) {
      dispatch(failed(e instanceof Error ? e.message : "Save failed"))
    }
  }

  return {
    iAmLeader,
    teamPersona,
    userPersona,
    /** g4: the leader's workspace persona (RLS lets only the leader write it). */
    saveTeam: (form: FormData) =>
      run(() => saveTeamPersona(teamId!, me!, text(form, "name"), text(form, "prompt"), teamPersona?.id)),
    /** g4 / D-04: my own persona; a second active one is rejected by the index, so an existing one is updated. */
    saveMine: (form: FormData) => run(() => saveUserPersona(me!, text(form, "name"), text(form, "prompt"), userPersona?.id)),
  }
}
