"use client"

import { deleteDb } from "@feature/entities"
import { useAppDispatch, useAppSelector } from "@shared/config/redux/hooks"
import { selectProfileId } from "../../selectors/workspace-selectors"
import { signedOut } from "../../stores/workspace-slice"
import { signOut } from "../../utils/workspace-remote"

/**
 * F6: sign-out ends the session, forgets the last workspace and deletes this profile's Dexie database.
 * ponytail: nothing is unsynced yet (008 writes online); once 007's outbox exists this must refuse or warn while ops are queued.
 */
export function useSignOut() {
  const dispatch = useAppDispatch()
  const profileId = useAppSelector(selectProfileId)
  return async () => {
    try {
      await signOut()
    } catch {
      // offline: the local session is cleared below regardless
    }
    dispatch(signedOut())
    if (profileId) await deleteDb(profileId)
  }
}
