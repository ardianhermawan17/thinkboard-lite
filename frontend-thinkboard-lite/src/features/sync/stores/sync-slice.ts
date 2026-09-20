import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { SyncPhase, SyncState } from "../types/redux"

export const initialSyncState: SyncState = {
  phase: "collaboration",
  ui: { syncing: false, pendingCount: 0, lastSyncedAt: null, syncError: null },
}

/** Every step the engine takes is one of these actions, so the whole protocol is readable in DevTools (03 §5.4). */
const syncSlice = createSlice({
  name: "sync",
  initialState: initialSyncState,
  reducers: {
    phaseChanged(state, action: PayloadAction<SyncPhase>) {
      state.phase = action.payload
    },
    syncStarted(state) {
      state.ui.syncing = true
      state.ui.syncError = null
    },
    syncFinished(state, action: PayloadAction<{ at: string }>) {
      state.ui.syncing = false
      state.ui.lastSyncedAt = action.payload.at
    },
    syncFailed(state, action: PayloadAction<string>) {
      state.ui.syncing = false
      state.ui.syncError = action.payload
    },
    outboxQueued(state, action: PayloadAction<{ count: number }>) {
      state.ui.pendingCount = action.payload.count
    },
    /** A marker for the realtime burst that was applied; carries no state of its own. */
    remoteChangeReceived: { reducer: (state) => state, prepare: (count: number) => ({ payload: { count } }) },
  },
})

export const { phaseChanged, syncStarted, syncFinished, syncFailed, outboxQueued, remoteChangeReceived } = syncSlice.actions
export const syncReducer = syncSlice.reducer
