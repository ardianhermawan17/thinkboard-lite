/** `sync.phase` is the mode switch (03 §5.1): 016 puts the toggle on it; until then the browser's online/offline events drive it. */
export type SyncPhase = "collaboration" | "offline"

/** Ids and phase only (I11). Throwaway state lives under `ui` and is stripped on persist (I16). */
export type SyncState = {
  phase: SyncPhase
  ui: { syncing: boolean; pendingCount: number; lastSyncedAt: string | null; syncError: string | null }
}
