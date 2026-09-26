"use client"

import { AnimatePresence, motion, pop } from "@shared/lib/motion"

/** g4: an ephemeral indicator. It is not durable UI, so it is not in the store; the hook owns its lifetime. */
export function LeaderDrawing({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          role="status"
          variants={pop}
          initial="hidden"
          animate="show"
          exit="exit"
          className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
        >
          Leader is drawing
        </motion.span>
      )}
    </AnimatePresence>
  )
}
