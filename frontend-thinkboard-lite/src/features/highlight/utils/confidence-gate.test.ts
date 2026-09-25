import { describe, expect, it } from "vitest"
import { isResultEligible, needsCorrection, OCR_CONFIDENCE_GATE } from "./confidence-gate"

const ocr = (confidence: number | null) => ({ extraction: "ocr" as const, confidence })
const text = { extraction: "text_layer" as const, confidence: 1 }

describe("confidence gate (g4)", () => {
  it("pins the gate at 0.70", () => {
    expect(OCR_CONFIDENCE_GATE).toBe(0.7)
  })

  it("a 0.69 OCR highlight is needs-correction and excluded from result input", () => {
    expect(needsCorrection(ocr(0.69))).toBe(true)
    expect(isResultEligible(ocr(0.69))).toBe(false)
  })

  it("0.70 is the inclusive boundary: at the gate it is eligible", () => {
    expect(needsCorrection(ocr(0.7))).toBe(false)
    expect(isResultEligible(ocr(0.7))).toBe(true)
  })

  it("an OCR highlight that never ran (null confidence) is needs-correction", () => {
    expect(needsCorrection(ocr(null))).toBe(true)
    expect(isResultEligible(ocr(null))).toBe(false)
  })

  it("a text-layer highlight is always eligible, whatever its confidence", () => {
    expect(needsCorrection(text)).toBe(false)
    expect(isResultEligible(text)).toBe(true)
    expect(isResultEligible({ extraction: "text_layer", confidence: null })).toBe(true)
  })
})
