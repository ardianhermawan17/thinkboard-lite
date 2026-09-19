import type { ISODateString, UUID } from "@shared/types/domain/common"
import { getDb } from "../db"
import type { NoteRow } from "../types"
import { uuidv7 } from "../utils/uuid7"
import { writeRow } from "./write"

export type NewNote = Pick<NoteRow, "highlightId" | "profileId"> & Partial<Pick<NoteRow, "visibility" | "inputMode" | "content" | "ink">>

const now = () => new Date().toISOString() as ISODateString

export async function insertNote(input: NewNote): Promise<NoteRow> {
  const row: NoteRow = {
    visibility: "individual",
    inputMode: "keyboard",
    content: "",
    ink: null,
    ...input,
    id: uuidv7() as UUID<"highlight_notes">,
    transcribedAt: null,
    transcribedBy: null,
    version: 1,
    createdAt: now(),
    updatedAt: now(),
    _sync: "pending",
  }
  await writeRow("notes", "insert", row)
  return row
}

/** `version` counts up on every write: the server's optimistic-concurrency check reads it. */
export async function updateNote(
  id: NoteRow["id"],
  patch: Partial<Pick<NoteRow, "content" | "ink" | "visibility" | "inputMode" | "transcribedAt" | "transcribedBy">>
): Promise<NoteRow> {
  const cur = await getDb().notes.get(id)
  if (!cur) throw new Error(`note ${id} is not in the local database`)
  const row: NoteRow = { ...cur, ...patch, version: cur.version + 1, updatedAt: now(), _sync: "pending" }
  await writeRow("notes", "update", row)
  return row
}

export async function deleteNote(id: NoteRow["id"]): Promise<void> {
  const row = await getDb().notes.get(id)
  if (row) await writeRow("notes", "delete", row)
}
