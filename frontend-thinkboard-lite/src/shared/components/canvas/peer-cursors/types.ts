export type DisplayCursor = { id: string; x: number; y: number }

export type PeerCursorsProps = {
  /**
   * Called once with the imperative paint function. The container drives it straight from a ref (a cursor is
   * 60 fps transient, RULE-20) — cursors never pass through React state.
   */
  register?: (paint: (cursors: DisplayCursor[]) => void) => void
  color?: string
}
