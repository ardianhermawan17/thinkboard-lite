import type { RefObject } from "react"

/** One stop on the first-run tour. `selector` is the element to spotlight; omit it for a centred card. */
export type TourStep = {
  id: string
  title: string
  body: string
  selector?: string
}

export type TourRect = { x: number; y: number; width: number; height: number }

export type OnboardingTourState = {
  open: boolean
  index: number
  total: number
  last: boolean
  step: TourStep
  /** The spotlight target's viewport rect, or null for a centred step (or a target that never appeared). */
  rect: TourRect | null
  centered: boolean
  /** The scrim's clip-path: the whole viewport, minus the spotlight rectangle. A plain string so CSS can transition it. */
  clipPath: string
  cardRef: RefObject<HTMLDivElement | null>
  cardStyle: { left: number; top: number; width: number }
  next: () => void
  back: () => void
  skip: () => void
}
