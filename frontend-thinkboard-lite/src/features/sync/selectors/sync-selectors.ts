import type { RootState } from "@shared/config/redux/store"

export const selectSyncPhase = (state: RootState) => state.sync.phase
export const selectSyncing = (state: RootState) => state.sync.ui.syncing
export const selectPendingCount = (state: RootState) => state.sync.ui.pendingCount
export const selectLastSyncedAt = (state: RootState) => state.sync.ui.lastSyncedAt
export const selectSyncError = (state: RootState) => state.sync.ui.syncError
