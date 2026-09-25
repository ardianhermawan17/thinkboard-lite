import type { ReactElement } from "react"

export type OfflineBannerState = {
  visible: boolean
  label: string
  canResume: boolean
  resume: () => void
  manualOffline: boolean
  lastSyncedAt: string | null
}

/** The children must accept `disabled` + `title` (shadcn Button, Switch, Input, ...). */
export type DisabledWhenOfflineProps = {
  children: ReactElement<{ disabled?: boolean; title?: string; "aria-disabled"?: boolean }>
  /** g2: the visible reason every disabled control owes the user. */
  reason?: string
}
