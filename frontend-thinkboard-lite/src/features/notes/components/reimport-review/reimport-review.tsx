"use client"

import { Button } from "@shared/components/ui/button"
import { Textarea } from "@shared/components/ui/textarea"
import { useReimportReview } from "./use-reimport-review"

/** g3: paste an exported notes.md and re-import it. The counts come straight from 016's planner. */
export function ReimportReview() {
  const { open, setOpen, markdown, setMarkdown, plan, applied, busy, error, apply } = useReimportReview()

  return (
    <div className="border-t p-3">
      <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
        Re-import notes
      </Button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <Textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} rows={4} placeholder="Paste notes.md…" aria-label="notes.md" />
          {plan && (
            <p data-testid="reimport-plan" className="text-xs text-muted-foreground">
              {plan.matched} matched · {plan.unanchored} unanchored · {plan.orphans} orphans · {plan.missing} missing
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {applied !== null && (
            <p className="text-xs">
              Applied {applied} note{applied === 1 ? "" : "s"}.
            </p>
          )}
          <Button size="sm" disabled={busy || !plan || plan.matched === 0} onClick={() => void apply()}>
            Apply matched notes
          </Button>
        </div>
      )}
    </div>
  )
}
