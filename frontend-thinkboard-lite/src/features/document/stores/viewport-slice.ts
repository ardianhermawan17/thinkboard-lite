import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Rotation } from "@shared/utils/geometry"
import { MAX_ZOOM, MIN_ZOOM } from "@shared/utils/zoom-bounds"
import type { ViewportState } from "../types/redux"

export { MAX_ZOOM, MIN_ZOOM }

export const initialViewportState: ViewportState = {
  zoom: 1,
  page: 1,
  rotation: 0,
  ui: { pageCount: 0 },
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
// Until a document is open the page count is 0, and the cursor is just kept at 1 or more.
const lastPage = (pageCount: number) => Math.max(1, pageCount)

const viewportSlice = createSlice({
  name: "viewport",
  initialState: initialViewportState,
  reducers: {
    /** A document finished opening: remember its length and pull a stale persisted cursor back inside it. */
    documentOpened(state, action: PayloadAction<{ pageCount: number }>) {
      state.ui.pageCount = action.payload.pageCount
      state.page = clamp(state.page, 1, lastPage(action.payload.pageCount))
    },
    pageChanged(state, action: PayloadAction<number>) {
      state.page = clamp(Math.round(action.payload), 1, lastPage(state.ui.pageCount))
    },
    /** Committed zoom, at the end of a gesture: a pinch in flight never dispatches. */
    zoomChanged(state, action: PayloadAction<number>) {
      state.zoom = clamp(action.payload, MIN_ZOOM, MAX_ZOOM)
    },
    /** A quarter turn clockwise. */
    rotated(state) {
      state.rotation = ((state.rotation + 90) % 360) as Rotation
    },
  },
})

export const { documentOpened, pageChanged, zoomChanged, rotated } = viewportSlice.actions
export const viewportReducer = viewportSlice.reducer
