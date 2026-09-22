import { describe, expect, it } from "vitest"
import { MAX_ZOOM, MIN_ZOOM, documentOpened, initialViewportState, pageChanged, rotated, viewportReducer, zoomChanged } from "./viewport-slice"

const opened = (pageCount: number, from = initialViewportState) => viewportReducer(from, documentOpened({ pageCount }))

describe("viewport slice (g4)", () => {
  it("starts at page 1, zoom 1, rotation 0, and holds no pixels", () => {
    expect(initialViewportState).toEqual({ zoom: 1, page: 1, rotation: 0, ui: { pageCount: 0 } })
  })

  it("keeps the page cursor inside the document", () => {
    let s = opened(30)
    s = viewportReducer(s, pageChanged(12))
    expect(s.page).toBe(12)
    expect(viewportReducer(s, pageChanged(99)).page).toBe(30)
    expect(viewportReducer(s, pageChanged(-4)).page).toBe(1)
    expect(viewportReducer(s, pageChanged(7.6)).page).toBe(8)
  })

  it("pulls a stale persisted cursor back inside a shorter document when it opens", () => {
    const stale = { ...initialViewportState, page: 50 }
    expect(opened(30, stale).page).toBe(30)
  })

  it("keeps the cursor at 1 before any document is open", () => {
    expect(viewportReducer(initialViewportState, pageChanged(5)).page).toBe(1)
  })

  it("clamps committed zoom to the bounds", () => {
    expect(viewportReducer(initialViewportState, zoomChanged(100)).zoom).toBe(MAX_ZOOM)
    expect(viewportReducer(initialViewportState, zoomChanged(0.01)).zoom).toBe(MIN_ZOOM)
    expect(viewportReducer(initialViewportState, zoomChanged(2)).zoom).toBe(2)
  })

  it("turns a quarter clockwise and wraps to 0 after four", () => {
    let s = initialViewportState
    const seen = [1, 2, 3, 4].map(() => (s = viewportReducer(s, rotated())).rotation)
    expect(seen).toEqual([90, 180, 270, 0])
  })
})
