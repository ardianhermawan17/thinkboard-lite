import type { RootState } from "@shared/config/redux/store"

export const selectProfileId = (state: RootState) => state.workspace.profileId
export const selectTeamId = (state: RootState) => state.workspace.teamId
export const selectSessionId = (state: RootState) => state.workspace.sessionId
export const selectMode = (state: RootState) => state.workspace.mode
export const selectTourSeen = (state: RootState) => state.workspace.tourSeen
export const selectError = (state: RootState) => state.workspace.ui.error
