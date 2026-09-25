"use client"

import { useCallback, useMemo, useState } from "react"
import { META, useArtifactsForSession, useHighlightsForSession, useMeta, useNotesForSession } from "@feature/entities"
import { appendHighlightsToPdf, buildBundleZip, bundleFilename, type BundleHighlight, type BundleInput, type BundleNote } from "@shared/lib/bundle"
import { downloadBytes } from "@shared/lib/download"
import { loadArtifactBytes } from "@shared/lib/pdf"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import type { Rect } from "@shared/utils/geometry"
import type { SessionMeta } from "../../types/meta"
import type { ExportWorkspaceState } from "./types"

// The bbox shape is owned by features/highlight, which this feature may not import (I3); the export only needs
// the rect list, so it re-reads that one field here.
function rectsOf(value: unknown): Rect[] | null {
  if (typeof value !== "object" || value === null) return null
  const rects = (value as { rects?: unknown }).rects
  if (!Array.isArray(rects)) return null
  const valid = rects.filter((rect): rect is Rect => typeof rect === "object" && rect !== null && ["x", "y", "w", "h"].every((key) => typeof (rect as Record<string, unknown>)[key] === "number"))
  return valid.length > 0 ? valid : null
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return slug || "workspace"
}

/**
 * 027: the export control completes 016's seam. It assembles the session's rows and the main PDF's bytes into
 * `BundleInput`, appends `/Highlight` annotations (never re-rendering a page), zips the three files and saves
 * `workspace-{slug}-{yyyymmdd}.zip`. A highlight with no slug is skipped — it cannot be anchored (RULE-25).
 */
export function useExportWorkspace(): ExportWorkspaceState {
  const { profileId, sessionId } = useWorkspaceContext()
  const artifacts = useArtifactsForSession((sessionId ?? "") as never)
  const highlightRows = useHighlightsForSession((sessionId ?? "") as never)
  const noteRows = useNotesForSession((sessionId ?? "") as never)
  const session = useMeta(META.session)?.value as SessionMeta | undefined
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const artifact = (artifacts ?? []).find((row) => row.kind === "pdf" && row.storagePath)

  const highlights = useMemo<BundleHighlight[]>(
    () =>
      (highlightRows ?? []).flatMap((row): BundleHighlight[] => {
        const rects = rectsOf(row.bbox)
        if (!rects || row.page === null || !row.slug) return []
        return [{ id: row.id, slug: row.slug, page: row.page, rects, text: row.text, layer: row.layer, extraction: row.extraction, confidence: row.confidence, weight: row.weight }]
      }),
    [highlightRows]
  )

  const notes = useMemo<BundleNote[]>(
    () => (noteRows ?? []).map((row) => ({ id: row.id, highlightId: row.highlightId, content: row.content, inputMode: row.inputMode, visibility: row.visibility })),
    [noteRows]
  )

  const exportWorkspace = useCallback(async () => {
    if (!profileId || !sessionId) return setError("No workspace is open")
    if (!artifact?.storagePath) return setError("This workspace has no document to export")
    setBusy(true)
    setError(null)
    try {
      const { bytes } = await loadArtifactBytes(profileId, artifact.storagePath)
      const annotated = highlights.length > 0 ? await appendHighlightsToPdf(bytes, highlights) : bytes
      const input: BundleInput = {
        sessionId,
        artifactId: artifact.id,
        title: session?.title ?? null,
        goal: session?.initial_question ?? null,
        pageCount: artifact.pageCount,
        highlights,
        notes,
      }
      const zip = await buildBundleZip(input, annotated)
      downloadBytes(zip, bundleFilename(slugify(session?.title ?? sessionId), new Date()))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not export the workspace")
    } finally {
      setBusy(false)
    }
  }, [profileId, sessionId, artifact, highlights, notes, session])

  return { canExport: Boolean(profileId && sessionId && artifact?.storagePath), busy, error, exportWorkspace }
}
