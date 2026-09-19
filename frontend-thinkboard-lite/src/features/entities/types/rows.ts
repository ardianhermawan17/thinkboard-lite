import type { Artifact } from "@shared/types/domain/artifacts"
import type { HighlightNote } from "@shared/types/domain/highlight-notes"
import type { Highlight } from "@shared/types/domain/highlights"
import type { MiniConclusion } from "@shared/types/domain/mini-conclusions"
import type { PipelineRun } from "@shared/types/domain/pipeline-runs"
import type { PointConclusion } from "@shared/types/domain/point-conclusions"
import type { Point } from "@shared/types/domain/points"
import type { RunRendering } from "@shared/types/domain/run-renderings"

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}` ? `${Head}${Capitalize<CamelCase<Tail>>}` : S

/**
 * A generated snake_case row as Dexie stores it: camelCase keys (Dexie's index names are camelCase, e.g.
 * `[artifactId+page]`), the same values and brands. Derived, never hand-copied, so a new column arrives with
 * `npm run gen:types`. `toRow` / `toWire` are the only place the two shapes meet.
 */
export type Camel<T> = { [K in keyof T as CamelCase<K & string>]: T[K] }

/** The newest outbox op of the row: `pending` while queued, `failed` while parked (4xx), `clean` once the server confirmed. */
export type SyncFlag = "clean" | "pending" | "failed"

// Client-written rows carry `_sync`; it never crosses into a Postgres write (blueprint localOnlyFields).
export type ArtifactRow = Camel<Artifact> & { _sync: SyncFlag }
export type HighlightRow = Camel<Highlight> & { _sync: SyncFlag }
export type NoteRow = Camel<HighlightNote> & { _sync: SyncFlag }

// Server-owned rows: only apply-remote writes them, so there is no `_sync`.
export type MiniConclusionRow = Camel<MiniConclusion>
export type RunRow = Camel<PipelineRun> & {
  points: Camel<Point>[]
  conclusions: Camel<PointConclusion>[]
  renderings: Camel<RunRendering>[]
}

/** Non-mirrored data pulled into `meta` (DB-Q12): profiles, teams, personas, providers ... Task 007 fills it. */
export type MetaRow = { key: string; value: unknown }
