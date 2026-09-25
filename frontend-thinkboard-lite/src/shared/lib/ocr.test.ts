import { afterEach, describe, expect, it, vi } from "vitest"

const createWorker = vi.fn()
vi.mock("tesseract.js", () => ({ createWorker: (...a: unknown[]) => createWorker(...(a as [])) }))

import { cropRegion, recognizeRegion, terminateOcr } from "./ocr"

afterEach(async () => {
  await terminateOcr()
  createWorker.mockReset()
})

describe("cropRegion (g3, RULE-19)", () => {
  it("produces a crop-sized canvas and draws only the sub-rectangle", () => {
    const source = document.createElement("canvas")
    source.width = 600
    source.height = 800
    const probe = document.createElement("canvas")
    const drawImage = vi.spyOn(probe.getContext("2d")!, "drawImage")

    const crop = { x: 30, y: 40, w: 120.4, h: 90.6 }
    const canvas = cropRegion(source, crop)

    expect(canvas.width).toBe(120)
    expect(canvas.height).toBe(91)
    expect(drawImage).toHaveBeenCalledWith(source, 30, 40, 120.4, 90.6, 0, 0, 120, 91)
    drawImage.mockRestore()
  })

  it("never produces a zero-sized canvas", () => {
    const canvas = cropRegion(document.createElement("canvas"), { x: 0, y: 0, w: 0, h: 0 })
    expect(canvas.width).toBe(1)
    expect(canvas.height).toBe(1)
  })
})

describe("recognizeRegion (g3)", () => {
  it("passes the cropped region to the worker and normalizes confidence from 0-100 to 0-1", async () => {
    createWorker.mockResolvedValue({
      recognize: vi.fn(async () => ({ data: { text: "  Halo dunia  ", confidence: 82 } })),
      terminate: vi.fn(async () => ({})),
    })
    const result = await recognizeRegion(document.createElement("canvas"), { x: 0, y: 0, w: 10, h: 10 })
    expect(result).toEqual({ text: "Halo dunia", confidence: 0.82 })
    expect(createWorker).toHaveBeenCalledWith("ind+eng")
  })

  it("honours an explicit language string", async () => {
    createWorker.mockResolvedValue({ recognize: vi.fn(async () => ({ data: { text: "x", confidence: 99 } })), terminate: vi.fn(async () => ({})) })
    await recognizeRegion(document.createElement("canvas"), { x: 0, y: 0, w: 10, h: 10 }, { languages: "eng" })
    expect(createWorker).toHaveBeenCalledWith("eng")
  })

  it("fails soft (empty text, below-gate confidence) when the worker cannot start, so an offline mark still saves", async () => {
    createWorker.mockRejectedValue(new Error("no network"))
    await expect(recognizeRegion(document.createElement("canvas"), { x: 0, y: 0, w: 10, h: 10 })).resolves.toEqual({ text: "", confidence: 0 })
  })

  it("only creates one worker across calls, and terminateOcr releases it", async () => {
    const terminate = vi.fn(async () => ({}))
    createWorker.mockResolvedValue({ recognize: vi.fn(async () => ({ data: { text: "a", confidence: 100 } })), terminate })
    const crop = { x: 0, y: 0, w: 5, h: 5 }
    await recognizeRegion(document.createElement("canvas"), crop)
    await recognizeRegion(document.createElement("canvas"), crop)
    expect(createWorker).toHaveBeenCalledTimes(1)
    await terminateOcr()
    expect(terminate).toHaveBeenCalledTimes(1)
  })
})
