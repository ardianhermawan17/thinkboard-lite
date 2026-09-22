import type Konva from "konva"
import { describe, expect, it, vi } from "vitest"
import { paintHighlights } from "./highlight-layer.painter"

// jsdom has no real 2D canvas context, so a real Konva.Stage/Layer cannot be constructed here. This fake
// implements only the two calls the painter actually makes (add, batchDraw) — the same fake-object style
// already used for OPFS and Selection in this repo's other tests. paintHighlights still builds real
// Konva.Rect nodes; only the layer they're added to is a fake.
function fakeLayer() {
  const children: { destroy: () => void; attrs: Record<string, unknown> }[] = []
  const layer = {
    add: (node: { destroy: () => void; attrs: Record<string, unknown> }) => children.push(node),
    batchDraw: vi.fn(),
  }
  return { layer: layer as unknown as Konva.Layer, children }
}

describe("paintHighlights (g4)", () => {
  it("adds one non-interactive Rect per rect, styled with its highlight's color", () => {
    const { layer, children } = fakeLayer()
    paintHighlights(layer, [
      { x: 10, y: 20, w: 30, h: 5, color: "gold" },
      { x: 10, y: 30, w: 15, h: 5, color: "gold" },
    ])
    expect(children).toHaveLength(2)
    expect(children[0].attrs).toMatchObject({ x: 10, y: 20, width: 30, height: 5, fill: "gold", listening: false })
    expect(layer.batchDraw).toHaveBeenCalled()
  })

  it("the disposer destroys exactly the rects it painted, and redraws", () => {
    const { layer, children } = fakeLayer()
    const dispose = paintHighlights(layer, [
      { x: 0, y: 0, w: 1, h: 1, color: "red" },
      { x: 1, y: 1, w: 1, h: 1, color: "blue" },
    ])
    expect(children).toHaveLength(2)
    const destroySpies = children.map((c) => vi.spyOn(c, "destroy"))
    dispose()
    destroySpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
    expect(layer.batchDraw).toHaveBeenCalledTimes(2) // once on paint, once on dispose
  })

  it("draws nothing for an empty rect list", () => {
    const { layer, children } = fakeLayer()
    paintHighlights(layer, [])
    expect(children).toHaveLength(0)
    expect(layer.batchDraw).toHaveBeenCalled()
  })
})
