import type { ArtifactRow } from "@feature/entities/types"
import type { UUID } from "@shared/types/domain/common"
import type { ImportCandidate } from "../../utils/import-ladder"

export type ImportReviewItem = ImportCandidate & { id: string; selected: boolean; needsCorrection: boolean }

export type ImportReviewProps = {
  artifactId: ArtifactRow["id"]
  profileId: UUID<"profiles">
  /** What the ladder produced; each candidate carries its own page (032). Nothing is written until accepted. */
  candidates: ImportCandidate[]
  onCommitted?: (count: number) => void
}
