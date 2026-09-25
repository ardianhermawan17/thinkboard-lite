import type { ArtifactRow } from "@feature/entities/types"
import type { UUID } from "@shared/types/domain/common"
import type { ImportCandidate } from "../../utils/import-ladder"

export type ImportReviewItem = ImportCandidate & { id: string; selected: boolean; needsCorrection: boolean }

export type ImportReviewProps = {
  artifactId: ArtifactRow["id"]
  profileId: UUID<"profiles">
  page: number
  /** What the ladder produced (rung 1, 2 or 3). Nothing is written until the leader accepts it (g4). */
  candidates: ImportCandidate[]
  onCommitted?: (count: number) => void
}
