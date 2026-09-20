"use client"

import { Button } from "@shared/components/ui/button"
import { useMembers } from "./use-members"

export function Members() {
  const { members, me, iAmLeader, makeLeader } = useMembers()

  return (
    <ul className="flex flex-col gap-2" aria-label="Members">
      {members.map((m) => (
        <li key={m.profile_id} className="flex items-center justify-between gap-2 text-sm">
          <span className="min-w-0 truncate">
            {m.profiles?.full_name ?? m.profiles?.email ?? m.profile_id}
            {m.profile_id === me && " (you)"}
          </span>
          {m.role === "leader" ? (
            <span className="text-xs text-muted-foreground">Leader</span>
          ) : (
            iAmLeader && (
              <Button size="sm" variant="outline" onClick={() => void makeLeader(m.profile_id)}>
                Make leader
              </Button>
            )
          )}
        </li>
      ))}
    </ul>
  )
}
