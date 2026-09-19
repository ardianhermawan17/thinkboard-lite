import Dexie from "dexie"
import { createDb, dbName, type ThinkboardDb } from "./thinkboard-db"

export type { ThinkboardDb }
export { dbName }

let current: ThinkboardDb | null = null

/** Open (or return) the signed-in profile's database. Lazy, so nothing touches IndexedDB at import (SSR-safe). */
export function openDb(profileId: string): ThinkboardDb {
  if (current?.name !== dbName(profileId)) {
    current?.close()
    current = createDb(profileId)
  }
  return current
}

export function getDb(): ThinkboardDb {
  if (!current) throw new Error("no database is open: call openDb(profileId) after sign-in")
  return current
}

/** Sign-out (F6): close and delete this profile's database. */
export async function deleteDb(profileId: string): Promise<void> {
  if (current?.name === dbName(profileId)) {
    current.close()
    current = null
  }
  await Dexie.delete(dbName(profileId))
}

// ponytail: returns the open db and does not re-render on a profile switch; the shell remounts the tree on
// sign-in / sign-out (task 008). Make it a subscription only if a profile ever changes without a remount.
export const useDb = getDb
