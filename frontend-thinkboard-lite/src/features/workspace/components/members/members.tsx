"use client"

import { Button } from "@shared/components/ui/button"
import { motion, riseChild, stagger } from "@shared/lib/motion"
import { useMembers } from "./use-members"

/** Two initials for the avatar dot; falls back to "?" when a member has neither a name nor an email. */
function initials(member: { profiles?: { full_name?: string | null; email?: string | null } | null }): string {
  const label = member.profiles?.full_name ?? member.profiles?.email ?? ""
  const words = label.trim().split(/[\s@._-]+/).filter(Boolean)
  if (words.length === 0) return "?"
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase()
}

export function Members() {
  const { members, me, iAmLeader, makeLeader } = useMembers()

  return (
    <motion.ul className="flex flex-col gap-1" aria-label="Members" variants={stagger} initial="hidden" animate="show">
      {members.map((m) => (
        <motion.li
          key={m.profile_id}
          variants={riseChild}
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-sm transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted/60"
        >
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-pill bg-muted font-mono text-[10px] font-medium text-muted-foreground">
            {initials(m)}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {m.profiles?.full_name ?? m.profiles?.email ?? m.profile_id}
            {m.profile_id === me && <span className="text-muted-foreground"> (you)</span>}
          </span>
          {m.role === "leader" ? (
            <span className="rounded-pill bg-accent px-2 py-0.5 text-[10px] font-medium tracking-wide text-accent-foreground uppercase">Leader</span>
          ) : (
            iAmLeader && (
              <Button size="xs" variant="ghost" onClick={() => void makeLeader(m.profile_id)}>
                Make leader
              </Button>
            )
          )}
        </motion.li>
      ))}
    </motion.ul>
  )
}
