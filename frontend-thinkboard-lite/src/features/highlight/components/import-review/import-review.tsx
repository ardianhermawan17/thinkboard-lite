"use client"

import { Button } from "@shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card"
import { Textarea } from "@shared/components/ui/textarea"
import { motion, rise, riseChild, stagger } from "@shared/lib/motion"
import { useImportReview } from "./use-import-review"
import type { ImportReviewProps } from "./types"

/**
 * g4: a review screen before commit. Every region gets a checkbox and editable text; a below-gate row says so.
 * The colour mask fires on charts and coloured table headers, so nothing commits without passing through here
 * (spec §5.4). The rows rise in one after another, so a 40-candidate import reads as a list rather than a wall.
 */
export function ImportReview(props: ImportReviewProps) {
  const { items, toggle, edit, toggleAll, selectedCount, accept } = useImportReview(props)
  if (items.length === 0) return null

  return (
    <motion.div variants={rise} initial="hidden" animate="show">
      <Card>
        <CardHeader>
          <CardTitle>Import review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={() => toggleAll(true)}>
              Select all
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toggleAll(false)}>
              Select none
            </Button>
          </div>
          <motion.ul className="flex flex-col gap-2" variants={stagger} initial="hidden" animate="show">
            {items.map((item) => (
              <motion.li key={item.id} variants={riseChild} className="flex flex-col gap-1 rounded border p-2">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={item.selected} onChange={(event) => toggle(item.id, event.target.checked)} />
                  <span className="text-muted-foreground">
                    p.{item.page} · {item.extraction}
                    {item.needsCorrection ? " · needs correction" : ""}
                  </span>
                </label>
                <Textarea value={item.text} onChange={(event) => edit(item.id, event.target.value)} rows={2} aria-label="Region text" />
              </motion.li>
            ))}
          </motion.ul>
          <Button disabled={selectedCount === 0} onClick={() => void accept()}>
            Import {selectedCount} region{selectedCount === 1 ? "" : "s"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
