"use client"

import { ChevronDown, RotateCcw } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Textarea } from "@shared/components/ui/textarea"
import { cn } from "@shared/lib/utils"
import { useReimportReview } from "./use-reimport-review"

/** g3: paste an exported notes.md and re-import it. The counts come straight from 016's planner. */
export function ReimportReview() {
  const { open, setOpen, markdown, setMarkdown, plan, applied, busy, error, apply } = useReimportReview()

  return (
    <div className="border-t border-border p-3">
      <Button size="sm" variant="ghost" className="w-full justify-between" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="size-3.5" aria-hidden />
          Re-import notes
        </span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]", open && "rotate-180")} aria-hidden />
      </Button>
      {open && (
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Exported notes.md</span>
            <Textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} rows={4} placeholder="Paste notes.md…" aria-label="notes.md" className="bg-background/60" />
          </label>
          {plan && (
            <p data-testid="reimport-plan" className="font-mono text-[11px] text-muted-foreground">
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
          <Button size="sm" className="self-start" disabled={busy || !plan || plan.matched === 0} onClick={() => void apply()}>
            Apply matched notes
          </Button>
        </div>
      )}
    </div>
  )
}
