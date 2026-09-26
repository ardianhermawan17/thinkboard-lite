"use client"

import { useMemo, type ReactNode } from "react"
import { META, useMeta } from "@feature/entities"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import { usePresence } from "../../use-presence"
import { PresenceContext } from "./presence-context"

// features/presence may not import features/workspace's MemberMeta type (I3), so it reads the two fields it needs.
type MemberLike = { profile_id?: string; role?: string }

/** 031: the single owner of the live channel. Peers, the leader flag, the publish function and the cursor store. */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profileId, sessionId } = useWorkspaceContext()
  const members = useMeta(META.members)?.value as MemberLike[] | undefined
  const leaderId = useMemo(() => members?.find((member) => member.role === "leader")?.profile_id ?? null, [members])
  const { peers, leaderDrawing, publishCursor, subscribe } = usePresence({ sessionId: sessionId ?? "", profileId: profileId ?? "", page: 0, leaderId })
  const value = useMemo(() => ({ peers, leaderDrawing, leaderId, publishCursor, subscribe }), [peers, leaderDrawing, leaderId, publishCursor, subscribe])
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}
