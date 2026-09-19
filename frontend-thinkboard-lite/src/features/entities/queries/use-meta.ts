import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { MetaRow } from "../types"

/** One non-mirrored value (profile, team, persona, provider ... DB-Q12). `undefined` while the first read is in flight. */
export function useMeta(key: string): MetaRow | undefined {
  const db = useDb()
  return useLiveQuery(() => db.meta.get(key), [db, key])
}
