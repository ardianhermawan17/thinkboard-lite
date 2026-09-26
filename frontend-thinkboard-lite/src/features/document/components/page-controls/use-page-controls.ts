"use client"

import { useCallback, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { pageChanged, rotated } from "../../stores/viewport-slice"
import { selectPage, selectPageCount, selectRotation } from "../../selectors/viewport-selectors"
import type { PageControlsState } from "./types"

/**
 * 035: the document's page cursor and rotation live in the viewport slice, but nothing dispatched `pageChanged` or
 * `rotated`, so a multi-page document was stuck on the first window and could not be turned. This container reads
 * the slice and dispatches the two actions; `pageWindow` then slides the live Konva pages around the new cursor.
 *
 * 043 adds the arrow keys: the reading hands stay on the page. They yield to anything that owns the arrows itself —
 * a text field, a tablist, a slider, or an open modal (the tour and the note sheet are both `aria-modal`) — so
 * typing, tabbing and reading a note never flip the page under the reader.
 */
export function usePageControls(): PageControlsState {
  const dispatch = useAppDispatch()
  const page = useAppSelector(selectPage)
  const pageCount = useAppSelector(selectPageCount)
  const rotation = useAppSelector(selectRotation)

  const goTo = useCallback((next: number) => dispatch(pageChanged(next)), [dispatch])
  const rotate = useCallback(() => dispatch(rotated()), [dispatch])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (!target) return
      if (target.closest("input, textarea, select, [contenteditable='true'], [role='tablist'], [role='tab'], [role='radiogroup'], [role='slider']")) return
      // An open dialog owns the arrows. Radix marks its sheet `role="dialog"` and not `aria-modal`, and the tour card
      // carries both, so the role is the one signal they share — reading a note must not flip the page behind it.
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === "ArrowLeft" && page > 1) {
        e.preventDefault()
        goTo(page - 1)
      } else if (e.key === "ArrowRight" && pageCount > 0 && page < pageCount) {
        e.preventDefault()
        goTo(page + 1)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [dispatch, goTo, page, pageCount])

  return {
    page,
    pageCount,
    rotation,
    canGoBack: page > 1,
    canGoForward: pageCount > 0 && page < pageCount,
    goTo,
    rotate,
  }
}
