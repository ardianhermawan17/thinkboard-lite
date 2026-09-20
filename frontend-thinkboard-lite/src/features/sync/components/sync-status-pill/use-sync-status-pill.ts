"use client"

import { useOutboxCount } from "@feature/entities"
import { useAppSelector } from "@shared/config/redux/hooks"
import { selectSyncError, selectSyncPhase, selectSyncing } from "../../selectors/sync-selectors"

/** What the header says about the engine: derived from the slice (phase, syncing, error) and the outbox's own counters. */
export function useSyncStatusPill() {
  const phase = useAppSelector(selectSyncPhase)
  const syncing = useAppSelector(selectSyncing)
  const syncError = useAppSelector(selectSyncError)
  const outbox = useOutboxCount()
  const queued = outbox?.queued ?? 0
  const failed = outbox?.failed ?? 0

  const label =
    failed > 0
      ? `${failed} failed`
      : phase === "offline"
        ? queued > 0
          ? `Offline, ${queued} to sync`
          : "Offline"
        : syncError
          ? "Sync error"
          : syncing
            ? "Syncing"
            : queued > 0
              ? `${queued} pending`
              : "Synced"

  return { label, attention: failed > 0 || (phase !== "offline" && Boolean(syncError)) }
}
