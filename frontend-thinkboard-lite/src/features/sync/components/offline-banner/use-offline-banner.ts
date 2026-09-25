"use client"

import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectCanResume, selectLastSyncedAt, selectManualOffline, selectNetworkDown, selectPendingCount, selectSyncPhase } from "../../selectors/sync-selectors"
import { manualOfflineSet } from "../../stores/sync-slice"
import type { OfflineBannerState } from "./types"

/**
 * g1/g3: the banner is driven by the slice alone. While the network is actually down it reports the queue;
 * once the network is back (or the user chose Work offline) it offers the explicit resume — never a silent
 * resync (spec §5.3).
 */
export function useOfflineBanner(): OfflineBannerState {
  const dispatch = useAppDispatch()
  const phase = useAppSelector(selectSyncPhase)
  const canResume = useAppSelector(selectCanResume)
  const networkDown = useAppSelector(selectNetworkDown)
  const pending = useAppSelector(selectPendingCount)
  const lastSyncedAt = useAppSelector(selectLastSyncedAt)
  const manualOffline = useAppSelector(selectManualOffline)

  const resume = useCallback(() => {
    dispatch(manualOfflineSet(false))
  }, [dispatch])

  const changes = pending === 1 ? "1 change" : `${pending} changes`
  const label = networkDown ? (pending > 0 ? `Offline · ${changes} to sync` : "Offline") : pending > 0 ? `Back online · ${changes} to sync` : "Back online"

  return { visible: phase === "offline", label, canResume, resume, manualOffline, lastSyncedAt }
}
