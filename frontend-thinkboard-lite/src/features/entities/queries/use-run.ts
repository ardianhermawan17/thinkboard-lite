import { useLiveQuery } from "dexie-react-hooks"
import { useDb } from "../db"
import type { RunRow } from "../types"

/** A finished run with its points, conclusions and renderings (the `runs` read cache). */
export function useRun(runId: RunRow["id"]): RunRow | undefined {
  const db = useDb()
  return useLiveQuery(() => db.runs.get(runId), [db, runId])
}
