import type { ISODateString, UUID } from "@shared/types/domain/common"
import { getDb } from "../db"
import type { ArtifactRow } from "../types"
import { uuidv7 } from "../utils/uuid7"
import { writeRow } from "./write"

export type NewArtifact = Pick<ArtifactRow, "sessionId" | "kind"> & Partial<Pick<ArtifactRow, "slot" | "title" | "storagePath" | "pageCount" | "createdBy">>

/** Artifact METADATA only: the PDF bytes live in OPFS and Storage, never here. */
export async function insertArtifact(input: NewArtifact): Promise<ArtifactRow> {
  const row: ArtifactRow = {
    slot: null,
    title: null,
    storagePath: null,
    pageCount: null,
    createdBy: null,
    ...input,
    id: uuidv7() as UUID<"artifacts">,
    createdAt: new Date().toISOString() as ISODateString,
    _sync: "pending",
  }
  await writeRow("artifacts", "insert", row)
  return row
}

export async function updateArtifact(id: ArtifactRow["id"], patch: Partial<Pick<ArtifactRow, "title" | "storagePath" | "pageCount">>): Promise<ArtifactRow> {
  const cur = await getDb().artifacts.get(id)
  if (!cur) throw new Error(`artifact ${id} is not in the local database`)
  const row: ArtifactRow = { ...cur, ...patch, _sync: "pending" }
  await writeRow("artifacts", "update", row)
  return row
}
