"use client"

import { Button } from "@shared/components/ui/button"
import { useOfflineBanner } from "./use-offline-banner"

function formatLastSynced(at: string): string {
  const date = new Date(at)
  return Number.isNaN(date.getTime()) ? at : date.toLocaleString()
}

/**
 * g2/g3: one strip under the header. It shows the queue size and lastSyncedAt, and exposes the only control
 * that ever resumes sync (`Sync now`). While the network is genuinely down there is no button — there is
 * nothing to resume yet.
 */
export function OfflineBanner() {
  const { visible, label, canResume, resume, lastSyncedAt } = useOfflineBanner()
  if (!visible) return null
  return (
    <div role="status" data-testid="offline-banner" className="flex flex-wrap items-center gap-3 border-b bg-muted px-4 py-1.5 text-xs">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">Last synced {lastSyncedAt ? formatLastSynced(lastSyncedAt) : "never"}</span>
      {canResume && (
        <Button size="sm" variant="outline" onClick={resume}>
          Sync now
        </Button>
      )}
    </div>
  )
}
