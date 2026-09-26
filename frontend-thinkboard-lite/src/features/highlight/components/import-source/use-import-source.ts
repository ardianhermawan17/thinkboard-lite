"use client"

import { useCallback, useState } from "react"
import { useArtifactsForSession } from "@feature/entities/queries/use-artifacts-for-session"
import type { ArtifactRow } from "@feature/entities/types"
import { loadArtifactBytes, openPdf, pageImageData } from "@shared/lib/pdf"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import { viewportLike } from "../../utils/annotation-quads"
import { annotationCandidates, flattenedCandidates, type ImportCandidate } from "../../utils/import-ladder"
import { textBoxesFromViewport, type PdfTextItemLike } from "../../utils/pdf-text-boxes"
import type { ImportSourceState } from "./types"

/**
 * 032's importer, rungs 1 and 2 (spec §5.4). It reads the session's main PDF bytes through the existing seam and,
 * per page, tries rung 1 first: exact `/Highlight` annotations + exact text, no OCR. A page with no annotations is
 * a flattened document — the mark is ink, so it rasterizes the page and finds the mark by its colour (rung 2), with
 * the text layer still supplying the exact text (RULE-19: no OCR for either rung). Rung 3 (a scan, OCR crops) is the
 * remaining follow-up. D-02's separately uploaded note copy stays its own follow-up.
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
        const viewport = page.getViewport({ scale: 1 })
        const content = await page.getTextContent()
        const boxes = textBoxesFromViewport(content.items as unknown as PdfTextItemLike[], { transform: viewport.transform })
        const annotations = (await page.getAnnotations()) as unknown as Parameters<typeof annotationCandidates>[0]
        const fromAnnotations = annotationCandidates(annotations, viewportLike(viewport), pageNumber, 0, boxes)
        // The ladder stops at the first rung that finds marks: annotations are exact, so a page that has them
        // never pays for a raster.
        if (fromAnnotations.length > 0) {
          found.push(...fromAnnotations)
          continue
        }
        const image = await pageImageData(doc, pageNumber)
        if (image) found.push(...flattenedCandidates(image, pageNumber, 0, boxes))
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
