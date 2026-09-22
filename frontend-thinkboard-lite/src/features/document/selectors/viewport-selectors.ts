import type { RootState } from "@shared/config/redux/store"

export const selectZoom = (state: RootState) => state.viewport.zoom
export const selectPage = (state: RootState) => state.viewport.page
export const selectRotation = (state: RootState) => state.viewport.rotation
export const selectPageCount = (state: RootState) => state.viewport.ui.pageCount
