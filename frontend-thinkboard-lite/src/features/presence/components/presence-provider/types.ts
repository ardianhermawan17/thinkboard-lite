import type { Cursor, Peer } from "../../types"

export type PresenceValue = {
  peers: Peer[]
  leaderDrawing: boolean
  leaderId: string | null
  publishCursor: (x: number, y: number, page: number, drawing?: boolean) => void
  subscribe: (listener: (cursors: Cursor[]) => void) => () => void
}
