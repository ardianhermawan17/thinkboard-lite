import { describe, expect, it } from "vitest"
import { pageWindow } from "@shared/utils/page-window"

describe("pageWindow (g2)", () => {
  it("is the cursor plus one neighbour each side", () => {
    expect(pageWindow(10, 30)).toEqual([9, 10, 11])
  })

  it("clips at the first page: never a page below 1", () => {
    expect(pageWindow(1, 30)).toEqual([1, 2])
  })

  it("clips at the last page", () => {
    expect(pageWindow(30, 30)).toEqual([29, 30])
  })

  it("never exceeds 3 pages, even on a 1- or 2-page document", () => {
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(1, 2)).toEqual([1, 2])
    expect(pageWindow(2, 2)).toEqual([1, 2])
  })

  it("is empty before a document is open (pageCount 0)", () => {
    expect(pageWindow(1, 0)).toEqual([])
  })

  it("never returns more than 3 Stages across a 30-page document, at any cursor", () => {
    for (let cursor = 1; cursor <= 30; cursor++) {
      expect(pageWindow(cursor, 30).length).toBeLessThanOrEqual(3)
    }
  })
})
