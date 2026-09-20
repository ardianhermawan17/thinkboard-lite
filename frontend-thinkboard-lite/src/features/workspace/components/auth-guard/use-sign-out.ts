"use client"

import { deleteDb, useOutboxCount } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectProfileId } from "../../selectors/workspace-selectors"
import { failed, signedOut } from "../../stores/workspace-slice"
import { signOut } from "../../utils/workspace-remote"

/**
 * F6: sign-out ends the session, forgets the last workspace and deletes this profile's Dexie database. That deletes the outbox
 * too, so it REFUSES while a write has not reached the server (queued, or parked after a 4xx): it would be silent data loss.
 * ponytail: a parked op has no retry/discard UI yet, so it blocks sign-out until then; clearing site data is the way out.
 */
export function useSignOut() {
  const dispatch = useAppDispatch()
  const profileId = useAppSelector(selectProfileId)
  const outbox = useOutboxCount()
  return async () => {
    const unsynced = (outbox?.queued ?? 0) + (outbox?.failed ?? 0)
    if (unsynced > 0) {
      dispatch(failed(`${unsynced} change${unsynced === 1 ? " is" : "s are"} not synced yet: stay connected until it is, then sign out`))
      return false
    }
    try {
      await signOut()
    } catch {
      // offline: the local session is cleared below regardless
    }
    dispatch(signedOut())
    if (profileId) await deleteDb(profileId)
    return true
  }
}
