import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"

/** Ops still to be sent, and ops parked after a 4xx (the sync status pill reads both). */
export function useOutboxCount(): { queued: number; failed: number } | undefined {
  const db = useDb()
  return useLiveQuery(
    async () => ({
      queued: await db.outbox.where("state").equals("queued").count(),
      failed: await db.outbox.where("state").equals("failed").count(),
    }),
    [db]
  )
}
