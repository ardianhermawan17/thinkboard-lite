"use client"

import { Button } from "@shared/components/ui/button"
import { Textarea } from "@shared/components/ui/textarea"
import { useWritingCheck } from "./use-writing-check"

/** Per-platform instructions, since the check has no way to tell iOS from Android from the page alone. */
const ENABLE_INSTRUCTIONS =
  "iPad: write with Apple Pencil into the box below. Android tablet with a stylus: touch the pen to the box and start writing. If nothing happens, look for a Scribble / stylus handwriting setting in your device's settings."

export function WritingCheck() {
  const { loading, checked, penDetected, complete } = useWritingCheck()

  if (loading || checked) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 shadow-soft">
      <p className="text-xs leading-relaxed text-muted-foreground">{ENABLE_INSTRUCTIONS}</p>
      <Textarea placeholder="Try writing here…" spellCheck={false} className="min-h-24 bg-background/60" />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{penDetected ? "Pen detected" : "No pen detected yet"}</span>
        <Button size="sm" onClick={() => void complete()}>
          Done
        </Button>
      </div>
    </div>
  )
}
