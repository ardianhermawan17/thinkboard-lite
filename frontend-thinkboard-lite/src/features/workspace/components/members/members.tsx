"use client"

import { Button } from "@shared/components/ui/button"
import { motion, riseChild, stagger } from "@shared/lib/motion"
import { useMembers } from "./use-members"

export function Members() {
  const { members, me, iAmLeader, makeLeader } = useMembers()

  return (
    <motion.ul className="flex flex-col gap-2" aria-label="Members" variants={stagger} initial="hidden" animate="show">
      {members.map((m) => (
        <motion.li key={m.profile_id} variants={riseChild} className="flex items-center justify-between gap-2 text-sm">
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
        </motion.li>
      ))}
    </motion.ul>
  )
}
