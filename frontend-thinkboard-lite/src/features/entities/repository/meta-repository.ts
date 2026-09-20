import { getDb } from "../db"

/**
 * Non-mirrored values (profile, team, roster, personas: DB-Q12) live in `meta` as key/value.
 * No outbox entry: they are read caches pulled from the server, never a client write of a domain row.
 */
export async function putMeta(key: string, value: unknown): Promise<void> {
  await getDb().meta.put({ key, value })
}
