"use client"

import { Button } from "@shared/components/ui/button"
import { useExportWorkspace } from "./use-export-workspace"

/** g4: the header's Export control. It is disabled with a reason when there is nothing to export. */
export function ExportWorkspace() {
  const { canExport, busy, error, exportWorkspace } = useExportWorkspace()
  const reason = error ?? (canExport ? undefined : "Open a workspace with a document to export")
  return (
    <Button data-testid="export-workspace" size="sm" variant="ghost" disabled={!canExport || busy} title={reason} onClick={() => void exportWorkspace()}>
      {busy ? "Exporting…" : "Export"}
    </Button>
  )
}
