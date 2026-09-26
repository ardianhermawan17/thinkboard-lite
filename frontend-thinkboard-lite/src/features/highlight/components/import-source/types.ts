import type { ArtifactRow } from "@feature/entities/types"
import type { ImportCandidate } from "../../utils/import-ladder"

export type ImportSourceState = {
  artifactId: ArtifactRow["id"] | null
  candidates: ImportCandidate[]
  busy: boolean
  error: string | null
  canScan: boolean
  scan: () => Promise<void>
}
