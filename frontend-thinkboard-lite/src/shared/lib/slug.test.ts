import { describe, expect, it } from "vitest"
import { highlightSlug } from "@shared/lib/slug"

const RECT = { x: 0.118, y: 0.412, w: 0.784, h: 0.025 }

describe("highlightSlug (g2)", () => {
  it("is deterministic: the same text, rect, page and order always give the same slug", async () => {
    const a = await highlightSlug("Cost basis is stated in 2023 prices", RECT, 3, 7)
    const b = await highlightSlug("Cost basis is stated in 2023 prices", RECT, 3, 7)
    expect(a).toBe(b)
  })

  it("matches the documented shape h-p{page:02}-{order:02}-{6}", async () => {
    const slug = await highlightSlug("some text", RECT, 3, 7)
    expect(slug).toMatch(/^h-p03-07-[0-9a-hjkmnp-tv-z]{6}$/)
  })

  it("changes when the text changes", async () => {
    const a = await highlightSlug("some text", RECT, 1, 1)
    const b = await highlightSlug("different text", RECT, 1, 1)
    expect(a).not.toBe(b)
  })

  it("changes when the rect changes", async () => {
    const a = await highlightSlug("some text", RECT, 1, 1)
    const b = await highlightSlug("some text", { ...RECT, x: RECT.x + 0.01 }, 1, 1)
    expect(a).not.toBe(b)
  })

  it("changes when the page or order changes, independent of the hash", async () => {
    const base = await highlightSlug("some text", RECT, 1, 1)
    const otherPage = await highlightSlug("some text", RECT, 2, 1)
    const otherOrder = await highlightSlug("some text", RECT, 1, 2)
    expect(otherPage.slice(0, 5)).not.toBe(base.slice(0, 5))
    expect(otherOrder).not.toBe(base)
    // the hash suffix (last 6 chars) is unchanged by page/order -- only the prefix carries them
    expect(base.slice(-6)).toBe(otherPage.slice(-6))
    expect(base.slice(-6)).toBe(otherOrder.slice(-6))
  })

  it("quantizes rect jitter below 0.00005 to the same slug", async () => {
    const a = await highlightSlug("some text", RECT, 1, 1)
    const b = await highlightSlug("some text", { ...RECT, x: RECT.x + 0.00001 }, 1, 1)
    expect(a).toBe(b)
  })

  it("pads page and order to two digits", async () => {
    const slug = await highlightSlug("t", RECT, 3, 7)
    expect(slug.startsWith("h-p03-07-")).toBe(true)
  })
})
