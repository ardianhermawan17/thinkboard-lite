export type RailHandleProps = {
  /** The rail's name, read as the vertical label ("Notes", "People"). */
  label: string
  /** Pull the rail back out. The handle only exists while the rail it belongs to is folded away. */
  onExpand: () => void
}
