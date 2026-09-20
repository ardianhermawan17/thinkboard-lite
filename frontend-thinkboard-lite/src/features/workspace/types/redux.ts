export type SessionMode = "planning" | "descriptive" | "visualize"

/** Ids and phase only, never a row (I11); rows live in Dexie. `ui` is throwaway and stripped on persist (I16). */
export type WorkspaceState = {
  profileId: string | null
  teamId: string | null
  sessionId: string | null
  mode: SessionMode
  ui: { error: string | null }
}
