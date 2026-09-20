import { useSyncExternalStore } from "react"

export type Breakpoint = "mobile" | "tablet" | "desktop"

// 03 §7 / D-11: mobile < 768, tablet 768-1279, desktop >= 1280.
const TABLET = "(min-width: 768px)"
const DESKTOP = "(min-width: 1280px)"

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(TABLET), window.matchMedia(DESKTOP)]
  queries.forEach((q) => q.addEventListener("change", onChange))
  return () => queries.forEach((q) => q.removeEventListener("change", onChange))
}

const snapshot = (): Breakpoint => (window.matchMedia(DESKTOP).matches ? "desktop" : window.matchMedia(TABLET).matches ? "tablet" : "mobile")

/**
 * The ONLY source of device branching (03 §7): media queries scattered through containers drift. Mobile ships last,
 * but the hook and the sheet ship now, so mobile is a layout pass and not a rewrite.
 * ponytail: the server snapshot is "desktop" (no window); a tablet re-renders once after hydration.
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, snapshot, () => "desktop")
}
