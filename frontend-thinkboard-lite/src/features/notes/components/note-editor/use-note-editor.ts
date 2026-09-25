import { useCallback, useEffect, useRef, useState } from "react"
import { insertNote, updateNote } from "@feature/entities/repository/note-repository"
import { watchForPen } from "@shared/lib/handwriting"
import type { NoteEditorProps } from "./types"

const AUTOSAVE_MS = 800

/**
 * g1/g5: one `content` field shared by both tabs; a keystroke resets the debounce timer, so a whole
 * paragraph typed continuously yields exactly one write (`updateNote`/`insertNote`), never one per keystroke.
 * `input_mode` stays "keyboard" here — the "stylus_os" value is withheld pending C6's human sign-off
 * (`todo-task-012-notes-and-handwriting.md` §3); the pen-detected badge is display-only, it writes nothing.
 */
export function useNoteEditor({ highlightId, profileId, note }: NoteEditorProps) {
  const [content, setContent] = useState(note?.content ?? "")
  const [penDetected, setPenDetected] = useState(false)
  const noteIdRef = useRef(note?.id)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    noteIdRef.current = note?.id
  }, [note?.id])

  useEffect(() => watchForPen(() => setPenDetected(true)), [])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const onContentChange = useCallback(
    (value: string) => {
      setContent(value)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void (async () => {
          if (noteIdRef.current) {
            await updateNote(noteIdRef.current, { content: value, inputMode: "keyboard" })
          } else {
            const created = await insertNote({ highlightId, profileId, content: value, inputMode: "keyboard" })
            noteIdRef.current = created.id
          }
        })()
      }, AUTOSAVE_MS)
    },
    [highlightId, profileId]
  )

  return { content, onContentChange, penDetected }
}
