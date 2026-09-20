"use client"

import { META, useMeta } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectProfileId, selectTeamId } from "../../selectors/workspace-selectors"
import { failed } from "../../stores/workspace-slice"
import type { MemberMeta } from "../../types/meta"
import { transferLeadership } from "../../utils/workspace-remote"

export function useMembers() {
  const dispatch = useAppDispatch()
  const me = useAppSelector(selectProfileId)
  const teamId = useAppSelector(selectTeamId)
  const members = (useMeta(META.members)?.value ?? []) as MemberMeta[]
  const iAmLeader = members.some((m) => m.profile_id === me && m.role === "leader")

  /** D-09: only the leader hands the role over; the RPC keeps exactly one leader. */
  async function makeLeader(profileId: string) {
    if (!teamId) return
    try {
      await transferLeadership(teamId, profileId, members)
    } catch (e) {
      dispatch(failed(e instanceof Error ? e.message : "Transfer failed"))
    }
  }

  return { members, me, iAmLeader, makeLeader }
}
