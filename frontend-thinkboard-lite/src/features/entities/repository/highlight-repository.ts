import type { ISODateString, UUID } from "@shared/types/domain/common"
import { getDb } from "../db"
import type { HighlightRow, NoteRow } from "../types"
import { uuidv7 } from "../utils/uuid7"
import { writeRow, writeRows } from "./write"

export type NewHighlight = Pick<HighlightRow, "artifactId" | "profileId" | "text"> &
  Partial<Pick<HighlightRow, "page" | "bbox" | "confidence" | "extraction" | "slug" | "weight" | "layer">>

const now = () => new Date().toISOString() as ISODateString

async function current(id: HighlightRow["id"]): Promise<HighlightRow> {
  const row = await getDb().highlights.get(id)
  if (!row) throw new Error(`highlight ${id} is not in the local database`)
  return row
}

// defaults are the Postgres column defaults, so the local row equals what the server will store. Layer defaults
// to private (individual); the leader's import (021) passes layer='group' explicitly.
function buildHighlightRow(input: NewHighlight): HighlightRow {
  return {
    page: null,
    bbox: null,
    confidence: null,
    extraction: "text_layer",
    slug: null,
    weight: 1,
    ...input,
    id: uuidv7() as UUID<"highlights">,
    layer: input.layer ?? "individual",
    sharedAt: null,
    createdAt: now(),
    updatedAt: now(),
    _sync: "pending",
  }
}

/** A new highlight is private unless a leader imports group marks: only the leader writes the group layer (RULE-04). */
export async function insertHighlight(input: NewHighlight): Promise<HighlightRow> {
  const row = buildHighlightRow(input)
  await writeRow("highlights", "insert", row)
  return row
}

/** F5: a whole import commits in ONE Dexie transaction — 40 regions are one local write, not 40. */
export async function insertHighlights(inputs: NewHighlight[]): Promise<HighlightRow[]> {
  const rows = inputs.map(buildHighlightRow)
  await writeRows("highlights", "insert", rows)
  return rows
}

// ponytail: read, then write; a second write between the two would be lost locally. Single-user local writes make
// that unreachable today; move the read into the transaction if two writers ever share a row.
export async function updateHighlight(id: HighlightRow["id"], patch: Partial<Pick<HighlightRow, "page" | "bbox" | "confidence" | "text" | "slug" | "weight">>): Promise<HighlightRow> {
  const row: HighlightRow = { ...(await current(id)), ...patch, updatedAt: now(), _sync: "pending" }
  await writeRow("highlights", "update", row)
  return row
}

/** Deleting a highlight takes its notes and mini-conclusion with it, as the database cascade will. */
export async function deleteHighlight(id: HighlightRow["id"]): Promise<void> {
  const db = getDb()
  const row = await db.highlights.get(id)
  if (!row) return
  await writeRow("highlights", "delete", row, {
    also: [db.notes, db.miniConclusions],
    inTx: async () => {
      await db.notes.where("highlightId").equals(id).delete()
      await db.miniConclusions.delete(id)
    },
  })
}

/** Share a private highlight with the workspace (RULE-05): one `promote_highlight` rpc, the note goes with it. */
export async function promoteHighlight(id: HighlightRow["id"], noteId?: NoteRow["id"]): Promise<HighlightRow> {
  const db = getDb()
  const stamp = now()
  const row: HighlightRow = { ...(await current(id)), sharedAt: stamp, updatedAt: stamp, _sync: "pending" }
  await writeRow("highlights", "rpc", row, {
    fn: "promote_highlight",
    payload: { p_highlight: id, p_note: noteId ?? null },
    also: [db.notes],
    // the server flips the author's note to group in the same call; its broadcast confirms it, so `_sync` stays clean
    inTx: () => db.notes.where("highlightId").equals(id).and((n) => n.profileId === row.profileId && (!noteId || n.id === noteId)).modify({ visibility: "group" }),
  })
  return row
}
