"use client"

import { useCallback, useState } from "react"
import { useArtifactsForSession } from "@feature/entities/queries/use-artifacts-for-session"
import type { ArtifactRow } from "@feature/entities/types"
import { loadArtifactBytes, openPdf } from "@shared/lib/pdf"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import { annotationCandidates, type ImportCandidate } from "../../utils/import-ladder"
import { textBoxesFromViewport, type PdfTextItemLike } from "../../utils/pdf-text-boxes"
import type { ImportSourceState } from "./types"

/**
 * 032: rung 1 against the OPEN document. It reads the session's main PDF bytes through the existing seam,
 * opens it, and asks each page for its `/Highlight` annotations + its text items, so the exact-text intersect
 * can run (RULE-19: no OCR, no upload). D-02's separately uploaded note copy is a separate follow-up.
 */
export function useImportSource(): ImportSourceState {
  const { profileId, sessionId } = useWorkspaceContext()
  const artifacts = useArtifactsForSession((sessionId ?? "") as ArtifactRow["sessionId"])
  const artifact = (artifacts ?? []).find((row) => row.kind === "pdf" && row.storagePath)

  const [candidates, setCandidates] = useState<ImportCandidate[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async () => {
    if (!profileId) return setError("No profile is signed in")
    if (!artifact?.storagePath) return setError("This workspace has no document to scan")
    setBusy(true)
    setError(null)
    try {
      const { bytes } = await loadArtifactBytes(profileId, artifact.storagePath)
      const doc = await openPdf(bytes)
      const found: ImportCandidate[] = []
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        const page = await doc.getPage(pageNumber)
        const annotations = (await page.getAnnotations()) as unknown as Parameters<typeof annotationCandidates>[0]
        const viewport = page.getViewport({ scale: 1 })
        const content = await page.getTextContent()
        const boxes = textBoxesFromViewport(content.items as unknown as PdfTextItemLike[], { transform: viewport.transform })
        // pdfjs v6 exposes convertToViewportPoint (not the older convertToViewportRectangle); build the rect
        // from its two opposite corners, keeping the min/max the parser expects.
        const viewportLike = {
          width: viewport.width,
          height: viewport.height,
          convertToViewportRectangle: ([x1, y1, x2, y2]: number[]) => {
            const [ax, ay] = viewport.convertToViewportPoint(x1, y1)
            const [bx, by] = viewport.convertToViewportPoint(x2, y2)
            return [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)]
          },
        }
        found.push(...annotationCandidates(annotations, viewportLike, pageNumber, 0, boxes))
      }
      setCandidates(found)
      if (found.length === 0) setError("No highlights were found in this document")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not scan the document")
    } finally {
      setBusy(false)
    }
  }, [profileId, artifact])

  return { artifactId: artifact?.id ?? null, candidates, busy, error, canScan: Boolean(profileId && artifact?.storagePath), scan }
}
