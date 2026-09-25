import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

const rects = vi.hoisted(() => [] as Record<string, unknown>[])

vi.mock("react-konva", () => ({
  Layer: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Rect: (props: Record<string, unknown>) => {
    rects.push(props)
    return null
  },
}))
vi.mock("./use-marquee", () => ({
  useMarquee: () => ({
    layerRef: { current: null },
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onPointerCancel: vi.fn(),
  }),
}))

import { Marquee } from "./marquee"

afterEach(() => {
  rects.length = 0
  cleanup()
})

describe("Marquee (g2)", () => {
  it("renders nothing at all when disarmed and fixture-free, so the page scrolls/pans untouched", () => {
    const { container } = render(<Marquee tool={null} size={{ w: 600, h: 800 }} rotation={0} />)
    expect(container.firstChild).toBeNull()
    expect(rects).toHaveLength(0)
  })

  it("arms a full-page hit rect that listens while a tool is active", () => {
    render(<Marquee tool="rect" size={{ w: 600, h: 800 }} rotation={0} />)
    expect(rects).toHaveLength(1)
    expect(rects[0]).toMatchObject({ name: "marquee-hit", width: 600, height: 800, listening: true })
  })

  it("paints fixtures even while disarmed, but keeps the hit rect non-listening (the Storybook case)", () => {
    render(<Marquee tool={null} size={{ w: 600, h: 800 }} rotation={0} fixtures={[[{ x: 0, y: 0 }, { x: 1, y: 1 }]]} />)
    expect(rects).toHaveLength(1)
    expect(rects[0].listening).toBe(false)
  })
})
