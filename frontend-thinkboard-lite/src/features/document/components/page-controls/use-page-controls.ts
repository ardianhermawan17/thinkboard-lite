"use client"

import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { pageChanged, rotated } from "../../stores/viewport-slice"
import { selectPage, selectPageCount, selectRotation } from "../../selectors/viewport-selectors"
import type { PageControlsState } from "./types"

/**
 * 035: the document's page cursor and rotation live in the viewport slice, but nothing dispatched `pageChanged` or
 * `rotated`, so a multi-page document was stuck on the first window and could not be turned. This container reads
 * the slice and dispatches the two actions; `pageWindow` then slides the live Konva pages around the new cursor.
 */
export function usePageControls(): PageControlsState {
  const dispatch = useAppDispatch()
  const page = useAppSelector(selectPage)
  const pageCount = useAppSelector(selectPageCount)
  const rotation = useAppSelector(selectRotation)

  const goTo = useCallback((next: number) => dispatch(pageChanged(next)), [dispatch])
  const rotate = useCallback(() => dispatch(rotated()), [dispatch])

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
