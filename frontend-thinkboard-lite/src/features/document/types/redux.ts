import type { Rotation } from "@shared/utils/geometry"

/**
 * The committed viewport: zoom, page cursor and rotation, never pixels or a pan offset (RULE-17). A pan or pinch in flight is
 * 60 fps transient state and lives in a ref, never here (03 5). `ui` is throwaway and stripped on persist (I16).
 */
export type ViewportState = {
  zoom: number
  /** 1-based, like PDF.js pages and the h-pNN slugs. */
  page: number
  rotation: Rotation
  ui: { pageCount: number }
}
