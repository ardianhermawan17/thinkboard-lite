"use client"

import { useCallback, useMemo, useState } from "react"
import { useHighlightsForSession } from "@feature/entities/queries/use-highlights-for-session"
import { useNotesForSession } from "@feature/entities/queries/use-notes-for-session"
import { insertNote, updateNote } from "@feature/entities/repository/note-repository"
import type { ArtifactRow } from "@feature/entities/types"
import { planReimport } from "@shared/lib/bundle"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import type { UUID } from "@shared/types/domain/common"
import type { ReimportReviewState } from "./types"

const NO_SESSION = "" as ArtifactRow["sessionId"]

/**
 * 029: re-import a pasted `notes.md`. 016's `planReimport` is the only reader of the identity anchor (RULE-25),
 * so a matched slug updates the author's note (never a duplicate) and everything else is only reported.
 */
export function useReimportReview(): ReimportReviewState {
  const { profileId, sessionId } = useWorkspaceContext()
  const highlights = useHighlightsForSession((sessionId ?? NO_SESSION) as ArtifactRow["sessionId"])
  const notes = useNotesForSession((sessionId ?? NO_SESSION) as ArtifactRow["sessionId"])
  const [open, setOpen] = useState(false)
  const [markdown, setMarkdown] = useState("")
  const [applied, setApplied] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bySlug = useMemo(() => new Map((highlights ?? []).flatMap((highlight) => (highlight.slug ? [[highlight.slug, highlight] as const] : []))), [highlights])
  const planned = useMemo(() => (markdown.trim() ? planReimport(markdown, [...bySlug.keys()]) : null), [markdown, bySlug])
  const plan = planned ? { matched: planned.updates.length, unanchored: planned.unanchored.length, orphans: planned.orphans.length, missing: planned.missing.length } : null

  const apply = useCallback(async () => {
    if (!planned || !profileId) return
    setBusy(true)
    setError(null)
    try {
      let count = 0
      for (const update of planned.updates) {
        const highlight = bySlug.get(update.slug)
        if (!highlight) continue
        const existing = (notes ?? []).find((note) => note.highlightId === highlight.id && note.profileId === profileId)
        if (existing) {
          // Re-applying the same text is a no-op; only a changed prose writes.
          if (existing.content !== update.content) await updateNote(existing.id, { content: update.content })
        } else {
          await insertNote({ highlightId: highlight.id, profileId: profileId as UUID<"profiles">, content: update.content })
        }
        count += 1
      }
      setApplied(count)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not re-import the notes")
    } finally {
      setBusy(false)
    }
  }, [planned, profileId, bySlug, notes])

  return { open, setOpen, markdown, setMarkdown, plan, applied, busy, error, apply }
}
