"use client"

import { Button } from "@shared/components/ui/button"
import { usePageControls } from "./use-page-controls"

/**
 * 035: prev/next through the open document and a quarter-turn rotate. It only dispatches viewport actions — the
 * viewer's page window and every layer follow the slice, so there is no second source of the current page.
 */
export function PageControls() {
  const { page, pageCount, rotation, canGoBack, canGoForward, goTo, rotate } = usePageControls()

  return (
    <div role="toolbar" aria-label="Page" className="flex items-center gap-1 border-b px-2 py-1">
      <Button size="sm" variant="ghost" disabled={!canGoBack} onClick={() => goTo(page - 1)} aria-label="Previous page">
        ‹ Prev
      </Button>
      <span data-testid="page-indicator" className="min-w-24 text-center text-xs text-muted-foreground">
        Page {page}
        {pageCount > 0 ? ` of ${pageCount}` : ""}
      </span>
      <Button size="sm" variant="ghost" disabled={!canGoForward} onClick={() => goTo(page + 1)} aria-label="Next page">
        Next ›
      </Button>
      <Button size="sm" variant="ghost" onClick={rotate} aria-label="Rotate 90 degrees" title={`Rotate 90° (now ${rotation}°)`}>
        ⟳ Rotate
      </Button>
    </div>
  )
}
