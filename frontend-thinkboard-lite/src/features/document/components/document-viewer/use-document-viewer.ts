import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { useArtifactsForSession } from "@feature/entities/queries/use-artifacts-for-session"
import { openPdf, type PdfDocument } from "@shared/lib/pdf"
import { loadArtifactBytes } from "@shared/lib/pdf"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import { pageWindow } from "@shared/utils/page-window"
import { selectProfileId } from "@feature/workspace/selectors/workspace-selectors"
import type { UUID } from "@shared/types/domain/common"
import { documentOpened, zoomChanged } from "../../stores/viewport-slice"
import { selectPage, selectPageCount, selectRotation, selectZoom } from "../../selectors/viewport-selectors"
import type { DocumentViewerState } from "./types"

/**
 * Orchestrates g1-g4: finds the session's main PDF, downloads/caches its bytes, opens it, and hands `document-viewer.tsx`
 * exactly the ±1 page window to mount. A container leaf: the only place in this leaf tree that touches Redux or Dexie.
 */
export function useDocumentViewer(sessionId: UUID<"sessions">): DocumentViewerState {
  const dispatch = useAppDispatch()
  const profileId = useAppSelector(selectProfileId)
  const zoom = useAppSelector(selectZoom)
  const page = useAppSelector(selectPage)
  const rotation = useAppSelector(selectRotation)
  const pageCount = useAppSelector(selectPageCount)
  const { reportPage } = useWorkspaceContext()

  // 033: presence may not read the viewport slice (a feature may not import another feature), so the current page
  // is mirrored into the shared workspace context for the leader-drawing check (015 g4).
  useEffect(() => {
    reportPage(page)
  }, [page, reportPage])

  const artifacts = useArtifactsForSession(sessionId)
  const pdfArtifact = artifacts?.find((a) => a.kind === "pdf")

  const [doc, setDoc] = useState<PdfDocument | null>(null)
  const [error, setError] = useState<string | null>(null)

  // A change of artifact/profile means whatever `doc` we have is for the wrong one — never show it while the new one loads.
  const loadKey = `${profileId ?? ""}:${pdfArtifact?.storagePath ?? ""}`
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const shownDoc = loadedFor === loadKey ? doc : null

  useEffect(() => {
    if (!profileId || !pdfArtifact?.storagePath) return
    let cancelled = false
    loadArtifactBytes(profileId, pdfArtifact.storagePath)
      .then(({ bytes }) => openPdf(bytes))
      .then((opened) => {
        if (cancelled) return
        setDoc(opened)
        setLoadedFor(loadKey)
        dispatch(documentOpened({ pageCount: opened.numPages }))
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not open the document")
      })
    return () => {
      cancelled = true
    }
  }, [profileId, pdfArtifact?.storagePath, dispatch, loadKey])

  return {
    doc: shownDoc,
    artifactId: pdfArtifact?.id ?? null,
    profileId,
    error,
    pages: pageWindow(page, pageCount),
    zoom,
    rotation,
    onZoomCommit: (z: number) => dispatch(zoomChanged(z)),
  }
}
