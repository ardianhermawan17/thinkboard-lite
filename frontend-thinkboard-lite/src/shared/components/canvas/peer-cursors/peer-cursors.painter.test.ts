import type Konva from "konva"
import { describe, expect, it, vi } from "vitest"
import { paintCursors } from "./peer-cursors.painter"

function fakeLayer() {
  const children: { destroy: () => void; attrs: Record<string, unknown> }[] = []
  return { layer: { add: (node: { destroy: () => void; attrs: Record<string, unknown> }) => children.push(node), batchDraw: vi.fn() } as unknown as Konva.Layer, children }
}

describe("paintCursors (g2)", () => {
  it("adds one non-interactive circle per cursor", () => {
    const { layer, children } = fakeLayer()
    paintCursors(layer, [
      { id: "p1", x: 10, y: 20 },
      { id: "p2", x: 30, y: 40 },
    ])
    expect(children).toHaveLength(2)
    expect(children[0].attrs).toMatchObject({ x: 10, y: 20, radius: 5, listening: false })
    expect(layer.batchDraw).toHaveBeenCalled()
  })

  it("the disposer destroys exactly what it painted", () => {
    const { layer, children } = fakeLayer()
    const dispose = paintCursors(layer, [{ id: "p1", x: 0, y: 0 }])
    const destroy = vi.spyOn(children[0], "destroy")
    dispose()
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(layer.batchDraw).toHaveBeenCalledTimes(2)
  })

  it("draws nothing for an empty cursor list", () => {
    const { layer, children } = fakeLayer()
    paintCursors(layer, [])
    expect(children).toHaveLength(0)
    expect(layer.batchDraw).toHaveBeenCalled()
  })
})
