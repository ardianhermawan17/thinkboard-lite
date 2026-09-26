"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectTourSeen } from "../../selectors/workspace-selectors"
import { tourCompleted } from "../../stores/workspace-slice"
import type { OnboardingTourState, TourRect, TourStep } from "./types"

/**
 * Eight stops through the document view: what the document is, how to mark it, where the notes live, how to bring
 * your own highlights in, who else is here, how to make room, and how to take it away. The copy names the product's
 * own vocabulary.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your workspace",
    body: "A PDF, your team, and the notes you make on it — in one place. It keeps working when the network does not. This tour takes about a minute.",
  },
  { id: "document", title: "Read the document", body: "Pinch to zoom or pan, and use Prev / Next to move through the pages — the arrow keys work too.", selector: '[data-testid="document-area"]' },
  {
    id: "tools",
    title: "Mark what matters",
    body: "Select text to highlight a line — pick one of the four colours first. Rectangle and Freehand are for what a line of text cannot cover — a chart, a table, a figure.",
    selector: '[data-testid="region-toolbar"]',
  },
  { id: "notes", title: "Write it down", body: "Every highlight lands here. Open one to add a note to it — typed, or handwritten with a pen.", selector: '[data-testid="note-panel"]' },
  {
    id: "import",
    title: "Bring your own highlights",
    body: "Already marked this PDF somewhere else? This reads its existing highlights and offers them for review before anything is imported.",
    selector: '[data-testid="import-existing"]',
  },
  { id: "together", title: "Read it together", body: "See who is here, and where their cursor is on the page as they move.", selector: '[data-testid="presence-rail"]' },
  {
    id: "room",
    title: "Make room",
    body: "Each rail folds away from the chevron beside its own title — the notes on the right of the page, the people at the far edge. Fold both and the page takes the whole width. A highlight made while the notes are away is waiting in Notes.",
    selector: '[data-testid="notes-rail-header"]',
  },
  { id: "export", title: "Take it with you", body: "Export the workspace as a portable bundle: the annotated PDF, the notes as Markdown, and a manifest.", selector: '[data-testid="export-workspace"]' },
]

const MEASURE_RETRIES = 10
const MEASURE_RETRY_MS = 300
const CARD_W = 340
const CARD_H = 210
const GAP = 14

/** The scrim, clipped to everything except the spotlight. The same shape at every step, so CSS can transition it. */
function scrimClip(rect: TourRect | null): string {
  const [x, y, w, h] = rect ? [rect.x, rect.y, rect.width, rect.height] : [0, 0, 0, 0]
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x}px ${y}px, ${x}px ${y + h}px, ${x + w}px ${y + h}px, ${x + w}px ${y}px, ${x}px ${y}px)`
}

/**
 * The tour's state: which step is showing, and where the thing it points at is.
 *
 * `tourSeen` lives in the workspace slice (it persists), so the tour opens on the first visit and closes for good
 * once it is finished or skipped. The target is measured from the live DOM, tagged with the step it belongs to so a
 * new step never shows the old target, and retried a few times for a target that renders late — the PDF canvas.
 * Every hook lives here, not in the `.tsx` (I2).
 */
export function useOnboardingTour(): OnboardingTourState {
  const dispatch = useAppDispatch()
  const seen = useAppSelector(selectTourSeen)
  const [index, setIndex] = useState(0)
  const [measured, setMeasured] = useState<{ id: string; rect: TourRect } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const open = !seen
  const total = TOUR_STEPS.length
  const step = TOUR_STEPS[Math.min(index, total - 1)]
  const rect = step.selector && measured?.id === step.id ? measured.rect : null

  // Settling the tour also rewinds it, so a later "Show the tour again" starts at the first step. The hook stays
  // mounted while the tour is closed, so the local index would otherwise survive. (This runs on the close event,
  // not in an effect: React's compiler lint rejects a synchronous setState inside an effect.)
  const close = useCallback(() => {
    setIndex(0)
    setMeasured(null)
    dispatch(tourCompleted())
  }, [dispatch])

  useEffect(() => {
    if (!open || !step.selector) return
    const selector = step.selector
    const id = step.id
    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const measure = () => {
      const el = document.querySelector(selector)
      if (!el) {
        // Keep looking: the document canvas mounts after the workspace does, so the target may not exist yet.
        if (tries++ < MEASURE_RETRIES) {
          if (timer) clearTimeout(timer)
          timer = setTimeout(measure, MEASURE_RETRY_MS)
        }
        return
      }
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      const r = el.getBoundingClientRect()
      setMeasured({ id, rect: { x: r.left, y: r.top, width: r.width, height: r.height } })
    }
    measure()
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [open, step.selector, step.id])

  // It is a dialog: Escape leaves, the arrows move.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1 < total ? i + 1 : i))
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1))
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, close, total])

  // Keep focus on the tour while it is open.
  useEffect(() => {
    cardRef.current?.focus()
  }, [index, open])

  const next = useCallback(() => {
    if (index + 1 >= total) return close()
    setIndex(index + 1)
  }, [index, total, close])
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // Card placement: below the target when it fits, above otherwise, centred when there is no target.
  const vw = typeof window === "undefined" ? 0 : window.innerWidth
  const vh = typeof window === "undefined" ? 0 : window.innerHeight
  const centered = !rect
  const below = rect ? rect.y + rect.height + GAP + CARD_H < vh : false
  const left = centered ? (vw - CARD_W) / 2 : Math.min(Math.max(16, rect.x + rect.width / 2 - CARD_W / 2), Math.max(16, vw - CARD_W - 16))
  const top = centered ? (vh - CARD_H) / 2 : below ? rect.y + rect.height + GAP : Math.max(16, rect.y - CARD_H - GAP)

  return {
    open,
    index,
    total,
    last: index + 1 >= total,
    step,
    rect,
    centered,
    clipPath: scrimClip(rect),
    cardRef,
    cardStyle: { left, top, width: CARD_W },
    next,
    back,
    skip: close,
  }
}
