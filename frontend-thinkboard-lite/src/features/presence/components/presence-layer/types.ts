import type { Rotation } from "@shared/utils/geometry"

export type PresenceLayerProps = {
  /** The page this Stage shows: cursors are drawn only when they are on it. */
  page: number
  /** The displayed page box in CSS pixels (the Stage's own size). */
  size: { w: number; h: number }
  rotation: Rotation
}
