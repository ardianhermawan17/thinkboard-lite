import type { HighlightRow } from "@feature/entities/types"

/**
 * The OCR confidence gate (spec §5.4 rung 3, db §8.1 `confidence "OCR gate at 0.70"`). It is a *derived*
 * state, not a column: a region highlight whose OCR confidence is below the gate (or never ran) is
 * `needs-correction` and is excluded from any Result until a human accepts it. Text-layer highlights are
 * exact by construction and always eligible.
 */
export const OCR_CONFIDENCE_GATE = 0.7

type GateInput = Pick<HighlightRow, "extraction" | "confidence">

export function needsCorrection(highlight: GateInput): boolean {
  if (highlight.extraction !== "ocr") return false
  return highlight.confidence === null || highlight.confidence < OCR_CONFIDENCE_GATE
}

/** The predicate the Result engine filters its input by: at or above the gate, or exact text, is eligible. */
export function isResultEligible(highlight: GateInput): boolean {
  return !needsCorrection(highlight)
}
