export interface SendResult {
  status: number // HTTP status; 0 = the request never got an answer (offline, DNS, reset)
  error?: { message: string } | null
}

export type Outcome = "ok" | "transient" | "auth" | "permanent"

/** 05 §2.6: offline and 5xx retry; 401 refreshes once; every other 4xx (403 RLS, 409, 422 ...) parks and is never retried. */
export function classify(res: SendResult): Outcome {
  if (!res.error && res.status < 400) return "ok"
  if (res.status === 0 || res.status >= 500 || res.status === 408 || res.status === 429) return "transient"
  if (res.status === 401) return "auth"
  return "permanent"
}

/** 0.5 s, 1 s, 2 s ... capped at 30 s, with jitter so a room of tablets does not reconnect in lockstep. */
export const backoffMs = (attempts: number, random: () => number = Math.random): number =>
  Math.round(Math.min(30_000, 500 * 2 ** attempts) * (0.5 + random() / 2))
