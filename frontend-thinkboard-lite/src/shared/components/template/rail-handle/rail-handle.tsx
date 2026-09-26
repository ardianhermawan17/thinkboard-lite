"use client"

import { ChevronLeft } from "lucide-react"
import type { RailHandleProps } from "./types"

/**
 * 043: the folded half of a right-side rail. The rails fold from the chevron beside their own title; what is left
 * behind is this thin vertical handle, so the way back is exactly where the way out was. Presentational only — the
 * visibility state lives in the shared workspace context, which the rails (not this leaf) read.
 */
export function RailHandle({ label, onExpand }: RailHandleProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={`Show the ${label.toLowerCase()} rail`}
      className="flex h-full w-11 shrink-0 flex-col items-center gap-3 border-s border-border bg-sidebar/30 py-3 text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-muted hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      <span className="rotate-180 font-mono text-[10px] tracking-[0.2em] uppercase [writing-mode:vertical-rl]">{label}</span>
    </button>
  )
}
