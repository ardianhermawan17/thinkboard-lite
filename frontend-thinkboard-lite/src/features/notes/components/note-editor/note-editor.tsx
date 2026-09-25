"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import { useNoteEditor } from "./use-note-editor"
import type { NoteEditorProps } from "./types"

/**
 * g1: two tabs, one `content` field — switching tabs never loses text (05 §3.6). g2/I26: the handwriting
 * tab is a plain `<textarea>` (no contenteditable, no rich-text library), ruled-paper sized so the OS
 * stylus-to-text conversion (Tier A, 05 §3.1) has a real text field to write into.
 */
export function NoteEditor(props: NoteEditorProps) {
  const { content, onContentChange, penDetected } = useNoteEditor(props)

  return (
    <Tabs defaultValue="keyboard" className="w-full">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="keyboard">Ketik</TabsTrigger>
          <TabsTrigger value="handwriting">Tulis tangan</TabsTrigger>
        </TabsList>
        {penDetected && <span className="text-xs text-muted-foreground">pen detected</span>}
      </div>

      <TabsContent value="keyboard">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Write a note…"
          className="min-h-32"
        />
      </TabsContent>

      <TabsContent value="handwriting">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          spellCheck={false}
          placeholder="Write with your pen. Text appears as you go."
          className="min-h-40 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_calc(2.4em-1px),var(--border)_calc(2.4em-1px),var(--border)_calc(2.4em))] p-4 text-xl leading-[2.4]"
        />
      </TabsContent>
    </Tabs>
  )
}
