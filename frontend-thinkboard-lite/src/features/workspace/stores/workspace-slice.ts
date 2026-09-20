import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { SessionMode, WorkspaceState } from "../types/redux"

export const initialWorkspaceState: WorkspaceState = {
  profileId: null,
  teamId: null,
  sessionId: null,
  mode: "planning",
  ui: { error: null },
}

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: initialWorkspaceState,
  reducers: {
    signedIn(state, action: PayloadAction<{ profileId: string }>) {
      state.profileId = action.payload.profileId
      state.ui.error = null
    },
    /** Back to the initial state: the last workspace pointer goes with the account (F6). */
    signedOut: () => initialWorkspaceState,
    workspaceOpened(state, action: PayloadAction<{ teamId: string; sessionId: string; mode?: SessionMode }>) {
      state.teamId = action.payload.teamId
      state.sessionId = action.payload.sessionId
      if (action.payload.mode) state.mode = action.payload.mode
    },
    modeChanged(state, action: PayloadAction<SessionMode>) {
      state.mode = action.payload
    },
    failed(state, action: PayloadAction<string>) {
      state.ui.error = action.payload
    },
  },
})

export const { signedIn, signedOut, workspaceOpened, modeChanged, failed } = workspaceSlice.actions
export const workspaceReducer = workspaceSlice.reducer
