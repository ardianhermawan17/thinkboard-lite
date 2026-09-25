"use client"

/** g4: an ephemeral indicator. It is not durable UI, so it is not in the store; the hook owns its lifetime. */
export function LeaderDrawing({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <span role="status" className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      Leader is drawing
    </span>
  )
}
