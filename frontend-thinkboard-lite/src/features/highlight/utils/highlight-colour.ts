import { DEFAULT_HIGHLIGHT_COLOUR, isHighlightColour, type HighlightColour } from "../types/colour"

// Konva cannot read CSS variables (globals.css's own note), so the token is resolved here and handed to the painter
// as a string. These fallbacks are for the cases where there is no DOM to read from (SSR, jsdom) — they mirror
// globals.css's light values, and are only ever used when `getComputedStyle` cannot answer.
const FALLBACK: Record<HighlightColour, string> = {
  yellow: "oklch(0.9 0.17 95 / 45%)",
  green: "oklch(0.84 0.17 150 / 40%)",
  blue: "oklch(0.8 0.12 240 / 40%)",
  rose: "oklch(0.82 0.13 5 / 40%)",
}

/** The stored key (or null) resolved to a CSS colour for the canvas painter, theme-aware. */
export function highlightColour(key: string | null | undefined): string {
  const name: HighlightColour = isHighlightColour(key) ? key : DEFAULT_HIGHLIGHT_COLOUR
  if (typeof document === "undefined") return FALLBACK[name]
  const token = getComputedStyle(document.documentElement).getPropertyValue(`--highlight-${name}`).trim()
  return token || FALLBACK[name]
}

/** The colour a newly drawn mark uses: the chosen key, resolved. */
export function defaultHighlightColour(key: HighlightColour): string {
  return highlightColour(key)
}
