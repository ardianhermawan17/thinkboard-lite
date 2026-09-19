/**
 * RFC 9562 UUIDv7: a 48-bit unix-millisecond timestamp, then random bits. RULE-09: the client generates the id, so an
 * offline insert already has its final id and the server upsert is idempotent.
 * ponytail: random within one millisecond (ids from the same ms are not ordered); add a counter only if strict
 * same-millisecond ordering is ever needed.
 */
export function uuidv7(now: number = Date.now()): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  for (let i = 5, t = now; i >= 0; i--, t = Math.floor(t / 256)) b[i] = t % 256
  b[6] = (b[6] & 0x0f) | 0x70 // version 7
  b[8] = (b[8] & 0x3f) | 0x80 // variant 10
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
