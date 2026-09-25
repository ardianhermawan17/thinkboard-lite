"use client"

import { useState } from "react"
import { DocumentViewer } from "@feature/document/components/document-viewer"
import { HighlightedPage } from "@feature/highlight/components/highlighted-page"
import { NotePanel } from "@feature/notes/components/note-panel"
import { PresenceRail } from "@feature/presence/components/presence-rail"
import type { MarqueeTool } from "@shared/components/canvas/marquee"
import { Button } from "@shared/components/ui/button"
import type { UUID } from "@shared/types/domain/common"

const TOOLS: { value: MarqueeTool | null; label: string }[] = [
  { value: null, label: "Select" },
  { value: "rect", label: "Rectangle" },
  { value: "freehand", label: "Freehand" },
]

/**
 * 025: the one place `document` and `highlight` meet. A feature may import only `entities`/`sync` from another
 * feature (I3), so the composition lives at the app route; it runs no store selector or dispatch either
 * (I4: routes compose, never orchestrate) — `DocumentViewer` supplies every page argument through `renderPage`.
 * The only state it holds is the armed region tool.
 */
export function WorkspaceDocument({ sessionId }: { sessionId: string }) {
  const [tool, setTool] = useState<MarqueeTool | null>(null)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="toolbar" aria-label="Region tool" className="flex items-center gap-1 border-b px-2 py-1">
        {TOOLS.map((option) => (
          <Button key={option.label} size="sm" variant={tool === option.value ? "default" : "ghost"} aria-pressed={tool === option.value} onClick={() => setTool(option.value)}>
            {option.label}
          </Button>
        ))}
        {/* 028: who is here (shared workspace context), beside the tools. */}
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
