import type { RootState } from "@shared/config/redux/store"

export const selectSyncPhase = (state: RootState) => state.sync.phase
export const selectSyncing = (state: RootState) => state.sync.ui.syncing
export const selectPendingCount = (state: RootState) => state.sync.ui.pendingCount
export const selectLastSyncedAt = (state: RootState) => state.sync.ui.lastSyncedAt
export const selectSyncError = (state: RootState) => state.sync.ui.syncError
export const selectManualOffline = (state: RootState) => state.sync.manualOffline
export const selectNetworkDown = (state: RootState) => state.sync.ui.networkDown

/**
 * g3: the resume offer is shown exactly when the network is actually back but we are still offline — that is
 * the "Back online · N changes to sync" state. While the network is down there is nothing to resume yet.
 */
export const selectCanResume = (state: RootState) => state.sync.phase === "offline" && !state.sync.ui.networkDown
