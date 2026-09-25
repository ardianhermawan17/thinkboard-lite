"use client"

import { useMemo } from "react"
import { META, useMeta } from "@feature/entities"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import { usePresence } from "../../use-presence"
import type { PresenceRailState } from "./types"

// features/presence may not import features/workspace's MemberMeta type (I3), so it reads the two fields it needs.
type MemberLike = { profile_id?: string; role?: string }

/**
 * g2: the rail's state. Ids come from the shared workspace context (026); the leader comes from the members meta,
 * the roster's own home. Peer cursors are not painted here (see the task's scope note).
 */
export function usePresenceRail(): PresenceRailState {
  const { profileId, sessionId } = useWorkspaceContext()
  const members = useMeta(META.members)?.value as MemberLike[] | undefined
  const leaderId = useMemo(() => members?.find((member) => member.role === "leader")?.profile_id ?? null, [members])
  const { peers, leaderDrawing } = usePresence({ sessionId: sessionId ?? "", profileId: profileId ?? "", page: 0, leaderId })
  return { peers, leaderDrawing, leaderId }
}
