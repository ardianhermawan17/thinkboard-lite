"use client"

import { Keyboard, PenLine } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import { useNoteEditor } from "./use-note-editor"
import type { NoteEditorProps } from "./types"

/**
 * g1: two tabs, one `content` field — switching tabs never loses text (05 §3.6). g2/I26: the handwriting
 * tab is a plain `<textarea>` (no contenteditable, no rich-text library), ruled-paper sized so the OS
 * stylus-to-text conversion (Tier A, 05 §3.1) has a real text field to write into.
 *
 * The tab labels are the spec's own (06 g1, and the field-test protocol points a tester at them).
 */
export function NoteEditor(props: NoteEditorProps) {
  const { content, onContentChange, penDetected } = useNoteEditor(props)

  return (
    <Tabs defaultValue="keyboard" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="keyboard">
            <Keyboard className="size-3.5" aria-hidden />
            Ketik
          </TabsTrigger>
          <TabsTrigger value="handwriting">
            <PenLine className="size-3.5" aria-hidden />
            Tulis tangan
          </TabsTrigger>
        </TabsList>
        {penDetected && (
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-card/70 px-2 py-0.5 text-[11px] text-muted-foreground">
            <PenLine className="size-3" aria-hidden />
            Pen detected
          </span>
        )}
      </div>

      <TabsContent value="keyboard" className="pt-3">
        <Textarea value={content} onChange={(e) => onContentChange(e.target.value)} placeholder="Write a note…" className="min-h-32" />
      </TabsContent>

      <TabsContent value="handwriting" className="pt-3">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          spellCheck={false}
          placeholder="Write with your pen. Text appears as you go."
          className="min-h-44 rounded-xl bg-card/40 px-4 text-xl leading-[2.4] [background-image:repeating-linear-gradient(to_bottom,transparent,transparent_calc(2.4em-1px),var(--border)_calc(2.4em-1px),var(--border)_calc(2.4em))]"
        />
      </TabsContent>
    </Tabs>
  )
}
