import type { Peer } from "../../types"

export type PresenceRailState = {
  peers: Peer[]
  leaderDrawing: boolean
  leaderId: string | null
}
