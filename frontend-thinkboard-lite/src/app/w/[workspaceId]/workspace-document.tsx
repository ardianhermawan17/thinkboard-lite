"use client"

import { useState } from "react"
import { DocumentViewer } from "@feature/document/components/document-viewer"
import { ImportSource } from "@feature/highlight/components/import-source"
import { HighlightedPage } from "@feature/highlight/components/highlighted-page"
import { HIGHLIGHT_COLOURS, type HighlightColour } from "@feature/highlight/types/colour"
import { NotePanel } from "@feature/notes/components/note-panel"
import { PresenceLayer, PresenceProvider, PresenceRail, usePresenceContext } from "@feature/presence"
import { OnboardingTour } from "@feature/workspace/components/onboarding-tour"
import type { MarqueeTool } from "@shared/components/canvas/marquee"
import { RailHandle } from "@shared/components/template/rail-handle"
import { Button } from "@shared/components/ui/button"
import { cn } from "@shared/lib/utils"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
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
  // 043: the hue the next mark is stored with. Local, like the armed tool — it is a hand, not a preference.
  const [colorKey, setColorKey] = useState<HighlightColour>("yellow")
  const { notesVisible, setNotesVisible } = useWorkspaceContext()
  const { publishCursor } = usePresenceContext()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="toolbar" aria-label="Region tool" data-testid="region-toolbar" className="flex items-center gap-1 border-b border-border px-2 py-1">
        {TOOLS.map((option) => (
          <Button key={option.label} size="sm" variant={tool === option.value ? "default" : "ghost"} aria-pressed={tool === option.value} onClick={() => setTool(option.value)}>
            {option.label}
          </Button>
        ))}
        {/* 043: the four hues of §5.3, chosen before the mark is made. */}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <div role="group" aria-label="Highlight colour" data-testid="highlight-colours" className="flex items-center gap-2">
          {HIGHLIGHT_COLOURS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={colorKey === key}
              aria-label={`${key} highlight`}
              title={`${key} highlight`}
              onClick={() => setColorKey(key)}
              className={cn(
                "size-5 rounded-full border border-border outline-none transition-transform hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/40",
                colorKey === key && "ring-2 ring-foreground/50 ring-offset-2 ring-offset-background"
              )}
              style={{ background: `var(--highlight-${key})` }}
            />
          ))}
        </div>
        <PresenceRail />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden" data-testid="document-area">
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
                  colorKey={colorKey}
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
        {/* 026: the notes rail reads profileId from the shared workspace context, so it mounts here (I3/I4 safe).
            043: it folds from the chevron beside its title, leaving a handle in its place. */}
        {notesVisible ? (
          <aside className="hidden w-72 shrink-0 md:block" data-testid="notes-rail">
            <NotePanel />
            {/* 032: import the open document's existing highlights (rung 1), review-gated. */}
            <ImportSource />
          </aside>
        ) : (
          <div className="hidden md:block">
            <RailHandle label="Notes" onExpand={() => setNotesVisible(true)} />
          </div>
        )}
      </div>
      {/* 041: the first-run tour. It overlays the whole document view and leaves once it is finished or skipped. */}
      <OnboardingTour />
    </div>
  )
}
