import type Konva from "konva"
import { describe, expect, it, vi } from "vitest"
import { createStrokePainter, paintStroke } from "./marquee.painter"

// Same fake-layer style as highlight-layer.painter.test: jsdom has no real Stage, but the painter still
// builds real Konva nodes; only the Layer they are added to is a fake (add + batchDraw).
function fakeLayer() {
  const children: { destroy: () => void; attrs: Record<string, unknown> }[] = []
  const layer = {
    add: (node: { destroy: () => void; attrs: Record<string, unknown> }) => children.push(node),
    batchDraw: vi.fn(),
  }
  return { layer: layer as unknown as Konva.Layer, children }
}

describe("createStrokePainter (g1)", () => {
  it("freehand: adds one line node, appends points, and commits copies of them", () => {
    const { layer, children } = fakeLayer()
    const painter = createStrokePainter(layer, "freehand", { color: "red" })
    expect(children).toHaveLength(1)
    expect(layer.batchDraw).toHaveBeenCalled()

    painter.push({ x: 1, y: 2 })
    painter.push({ x: 3, y: 4 })
    expect(children[0].attrs.points).toEqual([1, 2, 3, 4])
    expect(painter.commit()).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ])
    // commit hands back copies, so mutating them cannot corrupt the live stroke
    const [first] = painter.commit()
    first.x = 99
    expect(painter.commit()[0].x).toBe(1)
  })

  it("rect: keeps only the first and latest corner and sizes the node to the box", () => {
    const { layer, children } = fakeLayer()
    const painter = createStrokePainter(layer, "rect", { color: "gold" })
    painter.push({ x: 30, y: 40 })
    painter.push({ x: 10, y: 90 })
    painter.push({ x: 10, y: 20 })
    expect(children[0].attrs).toMatchObject({ x: 10, y: 20, width: 20, height: 20 })
    expect(painter.commit()).toEqual([
      { x: 30, y: 40 },
      { x: 10, y: 20 },
    ])
  })

  it("clear empties the geometry without destroying the node; dispose removes it", () => {
    const { layer, children } = fakeLayer()
    const painter = createStrokePainter(layer, "freehand")
    painter.push({ x: 1, y: 1 })
    painter.clear()
    expect(painter.commit()).toEqual([])
    expect(children).toHaveLength(1)

    const destroy = vi.spyOn(children[0], "destroy")
    painter.dispose()
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(layer.batchDraw).toHaveBeenCalled()
  })

  it("paintStroke draws a stored polyline and returns a disposer (the fixture/Storybook path)", () => {
    const { layer, children } = fakeLayer()
    const dispose = paintStroke(layer, [{ x: 0, y: 0 }, { x: 5, y: 5 }], { color: "cyan" })
    expect(children[0].attrs).toMatchObject({ points: [0, 0, 5, 5], stroke: "cyan" })
    dispose()
    expect(children[0].attrs).toBeDefined() // node object survives; destroy was called on it
    expect(layer.batchDraw).toHaveBeenCalledTimes(2)
  })
})
