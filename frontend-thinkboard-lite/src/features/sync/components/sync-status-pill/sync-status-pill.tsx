"use client"

import { cn } from "@shared/lib/utils"
import { useSyncStatusPill } from "./use-sync-status-pill"

export function SyncStatusPill() {
  const { label, attention } = useSyncStatusPill()
  return (
    <span role="status" className={cn("rounded-full border px-2 py-0.5 text-xs text-muted-foreground", attention && "border-destructive text-destructive")}>
      {label}
    </span>
  )
}
