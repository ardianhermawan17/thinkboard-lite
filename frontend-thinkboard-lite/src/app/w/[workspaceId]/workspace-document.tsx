"use client"

import { useState } from "react"
import { DocumentViewer } from "@feature/document/components/document-viewer"
import { HighlightedPage } from "@feature/highlight/components/highlighted-page"
import { NotePanel } from "@feature/notes/components/note-panel"
import { PresenceLayer, PresenceProvider, PresenceRail, usePresenceContext } from "@feature/presence"
import type { MarqueeTool } from "@shared/components/canvas/marquee"
import { Button } from "@shared/components/ui/button"
import type { UUID } from "@shared/types/domain/common"
import { normalizePoint } from "@shared/utils/geometry"

const TOOLS: { value: MarqueeTool | null; label: string }[] = [
  { value: null, label: "Select" },
  { value: "rect", label: "Rectangle" },
  { value: "freehand", label: "Freehand" },
]

/**
 * The one place `document`, `highlight`, `notes` and `presence` meet. A feature may import only
 * `entities`/`sync` from another feature (I3), so the composition lives at the app route; it runs no store
 * selector or dispatch either (I4) — `DocumentViewer` supplies every page argument through `renderPage`, and
 * 026's shared workspace context supplies the ids. `PresenceProvider` owns the single live channel (031).
 */
export function WorkspaceDocument({ sessionId }: { sessionId: string }) {
  return (
    <PresenceProvider>
      <WorkspaceDocumentBody sessionId={sessionId} />
    </PresenceProvider>
  )
}

function WorkspaceDocumentBody({ sessionId }: { sessionId: string }) {
  const [tool, setTool] = useState<MarqueeTool | null>(null)
  const { publishCursor } = usePresenceContext()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="toolbar" aria-label="Region tool" className="flex items-center gap-1 border-b px-2 py-1">
        {TOOLS.map((option) => (
          <Button key={option.label} size="sm" variant={tool === option.value ? "default" : "ghost"} aria-pressed={tool === option.value} onClick={() => setTool(option.value)}>
            {option.label}
          </Button>
        ))}
        <PresenceRail />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <DocumentViewer
            sessionId={sessionId as UUID<"sessions">}
            renderPage={({ doc, artifactId, profileId, pageNumber, zoom, rotation, onZoomCommit }) =>
              artifactId && profileId ? (
                <HighlightedPage
                  doc={doc}
                  artifactId={artifactId}
                  profileId={profileId}
                  pageNumber={pageNumber}
                  zoom={zoom}
                  rotation={rotation}
                  onZoomCommit={onZoomCommit}
                  tool={tool}
                  overlay={(ctx) => <PresenceLayer page={ctx.pageNumber} size={ctx.size} rotation={ctx.rotation} />}
                  onPointerAt={(point, size) => {
                    // RULE-17: the wire carries page-relative 0-1, so a peer at another zoom/rotation still lands right.
                    const normalized = normalizePoint(point, { w: size.width, h: size.height }, rotation)
                    publishCursor(normalized.x, normalized.y, pageNumber)
                  }}
                />
              ) : null
            }
          />
        </div>
        {/* 026: the notes rail reads profileId from the shared workspace context, so it mounts here (I3/I4 safe). */}
        <aside className="hidden w-72 shrink-0 md:block">
          <NotePanel />
        </aside>
      </div>
    </div>
  )
}
