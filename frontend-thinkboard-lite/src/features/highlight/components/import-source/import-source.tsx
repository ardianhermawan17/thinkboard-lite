"use client"

import { Button } from "@shared/components/ui/button"
import { useWorkspaceContext } from "@shared/providers/workspace-provider"
import type { UUID } from "@shared/types/domain/common"
import { ImportReview } from "../import-review"
import { useImportSource } from "./use-import-source"

/** 032: scan the open document for existing highlights and offer them for review. A container leaf. */
export function ImportSource() {
  const { profileId } = useWorkspaceContext()
  const { artifactId, candidates, busy, error, canScan, scan } = useImportSource()

  return (
    <div className="flex flex-col gap-2 border-t p-3">
      <Button data-testid="import-existing" size="sm" variant="ghost" disabled={!canScan || busy} title={error ?? undefined} onClick={() => void scan()}>
        {busy ? "Scanning…" : "Import existing highlights"}
      </Button>
      {candidates.length > 0 && artifactId && profileId && (
        <ImportReview artifactId={artifactId} profileId={profileId as UUID<"profiles">} candidates={candidates} />
      )}
    </div>
  )
}
