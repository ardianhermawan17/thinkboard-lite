"use client"

import { useAppSelector } from "@shared/config/redux/hooks"
import { selectSyncPhase } from "../../selectors/sync-selectors"

/** I2: the selector lives in a hook, not the component. g2's gate reads this. */
export function useDisabledWhenOffline() {
  return { offline: useAppSelector(selectSyncPhase) === "offline" }
}
