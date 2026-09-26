"use client"

import type { Variants } from "motion/react"

// The one seam for the motion library (the placement tree: a third-party wrapper lives in `shared/lib`). Components
// import these instead of `motion/react`, so the provider configuration, the variants and the reduced-motion story
// stay in one place — the same shape as `pdf.ts`, `supabase.ts` and `opfs.ts`.
//
// Motion is DOM-only: the Konva canvases keep their imperative painters (a Konva layer is not a DOM node), so
// nothing here touches z0/z1/z2. `MotionConfig reducedMotion="user"` is mounted once in the provider tree, so every
// entrance below collapses to an instant state for a user who asks their OS for reduced motion.
//
// The entrances are deliberately TRANSFORM-ONLY (no opacity from 0). An entrance must never be able to hide the
// app: requestAnimationFrame is paused while a tab is in the background, so an opacity-from-0 animation would leave
// a workspace opened in a background tab invisible until it is focused. A rise settles by a few pixels instead, and
// the surface is readable at every moment.
export { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react"
export type { Variants }

/** The app-wide entrance: a short rise. The product is a calm reading surface, so entrances are quiet and quick. */
export const rise: Variants = {
  hidden: { y: 8 },
  show: { y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

/** A parent that reveals its children in reading order. Use with `riseChild`. */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
}

/** One row/child inside a `stagger` parent. */
export const riseChild: Variants = {
  hidden: { y: 6 },
  show: { y: 0, transition: { duration: 0.24, ease: "easeOut" } },
}

/** For ephemeral chips/badges that appear and disappear (e.g. "Leader is drawing"). Scale-only, same reason. */
export const pop: Variants = {
  hidden: { scale: 0.94 },
  show: { scale: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { scale: 0.94, transition: { duration: 0.12, ease: "easeIn" } },
}
