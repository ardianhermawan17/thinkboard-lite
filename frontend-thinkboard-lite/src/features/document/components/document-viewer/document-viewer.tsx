"use client"

import { Fragment } from "react"
import dynamic from "next/dynamic"
import { PageControls } from "../page-controls"
import { useDocumentViewer } from "./use-document-viewer"
import type { DocumentViewerProps } from "./types"

// react-konva touches window at import (hazard, 03 §6.1/§6.2): load the canvas leaf client-only, never during SSR.
const PageStage = dynamic(() => import("@shared/components/canvas/page-stage").then((m) => m.PageStage), { ssr: false })

export function DocumentViewer({ sessionId, renderPage }: DocumentViewerProps) {
  const { doc, artifactId, profileId, error, pages, zoom, rotation, onZoomCommit } = useDocumentViewer(sessionId)

  if (error) return <p role="alert">{error}</p>
  if (!doc) return <p>Loading document…</p>

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 035: page navigation + rotation. It renders no page of its own; it only dispatches the viewport actions
          the window and every layer already follow. */}
      <PageControls />
      <div className="relative min-h-0 flex-1 overflow-auto">
        {pages.map((pageNumber) => (
          <Fragment key={pageNumber}>
            {renderPage ? (
              renderPage({ doc, artifactId, profileId, pageNumber, zoom, rotation, onZoomCommit })
            ) : (
              <PageStage doc={doc} pageNumber={pageNumber} zoom={zoom} rotation={rotation} onZoomCommit={onZoomCommit} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
