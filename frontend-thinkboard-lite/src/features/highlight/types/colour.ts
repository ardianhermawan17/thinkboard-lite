/**
 * Spec §5.3's four highlight hues. A row stores the **key** (never a resolved colour: the tokens differ between
 * light and dark, so the value has to be resolved at render), and `null` means "the default".
 */
export const HIGHLIGHT_COLOURS = ["yellow", "green", "blue", "rose"] as const

export type HighlightColour = (typeof HIGHLIGHT_COLOURS)[number]

export const DEFAULT_HIGHLIGHT_COLOUR: HighlightColour = "yellow"

export function isHighlightColour(value: unknown): value is HighlightColour {
  return typeof value === "string" && (HIGHLIGHT_COLOURS as readonly string[]).includes(value)
}
