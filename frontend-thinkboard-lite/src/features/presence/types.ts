/** A member currently connected to the session, and the page they are on (g1). */
export type Peer = { profileId: string; page: number }

/** An ephemeral cursor, normalized page-relative (RULE-17); `drawing:false` is the stroke-end signal (g4). */
export type Cursor = { profileId: string; page: number; x: number; y: number; drawing?: boolean }
