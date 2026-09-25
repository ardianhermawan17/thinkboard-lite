/** `sync.phase` is the mode switch (spec §5.3, 03 §5.1): 016 puts the manual toggle on it. */
export type SyncPhase = "collaboration" | "offline"

/**
 * Ids and phase only (I11). Throwaway state lives under `ui` and is stripped on persist (I16).
 *
 * `manualOffline` is the user's explicit *Work offline* choice: it is durable (it must survive a reload) and
 * authoritative — `navigator.onLine` may set `phase` but never clears this (spec §5.3, g1). `ui.networkDown`
 * is the transient mirror of the browser's own offline event.
 */
export type SyncState = {
  phase: SyncPhase
  manualOffline: boolean
  ui: { syncing: boolean; pendingCount: number; lastSyncedAt: string | null; syncError: string | null; networkDown: boolean }
}
