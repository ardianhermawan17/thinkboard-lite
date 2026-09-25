import { useCallback, useEffect, useState } from "react"
import { getMeta, putMeta } from "@feature/entities/repository/meta-repository"
import { watchForPen } from "@shared/lib/handwriting"

export const HANDWRITING_META_KEY = "handwriting"

export type HandwritingCheckResult = { os: string; unavailable: boolean }

/**
 * g4: a one-time practice box per device — `meta.handwriting` decides whether it has already run.
 * The recorded result here is a local capability read (pen seen or not), never the pilot's real g6
 * device test: that needs three humans writing real Indonesian on their own tablets (Q7/Q8/Q9,
 * `todo-task-012-notes-and-handwriting.md` §3) and is out of an agent's reach.
 */
export function useWritingCheck() {
  const [checked, setChecked] = useState<HandwritingCheckResult | undefined>()
  const [loading, setLoading] = useState(true)
  const [penDetected, setPenDetected] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getMeta(HANDWRITING_META_KEY).then((value) => {
      if (!cancelled) {
        setChecked(value as HandwritingCheckResult | undefined)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => watchForPen(() => setPenDetected(true)), [])

  const complete = useCallback(async () => {
    const os = typeof navigator !== "undefined" ? navigator.platform : "unknown"
    const result: HandwritingCheckResult = { os, unavailable: !penDetected }
    await putMeta(HANDWRITING_META_KEY, result)
    setChecked(result)
  }, [penDetected])

  return { loading, checked, penDetected, complete }
}
