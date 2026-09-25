"use client"

import { cloneElement } from "react"
import { useDisabledWhenOffline } from "./use-disabled-when-offline"
import type { DisabledWhenOfflineProps } from "./types"

/**
 * g2: while offline, a control that cannot work is rendered **disabled with its reason** (title + aria),
 * never hidden and never silently dead. 016 pins the wrapper; task 013's sheets are its first real user.
 */
export function DisabledWhenOffline({ children, reason = "Unavailable offline" }: DisabledWhenOfflineProps) {
  const { offline } = useDisabledWhenOffline()
  if (!offline) return children
  return cloneElement(children, { disabled: true, "aria-disabled": true, title: reason })
}
