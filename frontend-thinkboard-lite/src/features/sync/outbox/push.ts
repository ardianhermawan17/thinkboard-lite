import type { OutboxOp } from "@feature/entities"
import { backoffMs, classify, type SendResult } from "./backoff"

/** Everything the drain touches is injected, so the protocol is tested without a network or a database. */
export interface PushDeps {
  next: () => Promise<OutboxOp | undefined>
  send: (op: OutboxOp) => Promise<SendResult>
  confirm: (op: OutboxOp) => Promise<void>
  park: (op: OutboxOp, message: string) => Promise<OutboxOp[]>
  bump: (op: OutboxOp, message: string) => Promise<void>
  refreshAuth: () => Promise<boolean>
}

export interface DrainResult {
  sent: OutboxOp[]
  parked: OutboxOp[]
  stopped: "empty" | "aborted" | "transient"
  retryInMs?: number // set when stopped = "transient"
}

/**
 * 05 §2.2: the only path from local to server. Strict seq order; an op leaves the outbox only when the server confirmed it.
 * A 4xx PARKS the op and the drain carries on with the rest (F1: a parked op must never stall the queue); the next
 * `deps.next()` skips it because it is no longer `queued`. A transient failure stops the drain and asks to be retried.
 */
export async function drainOutbox(deps: PushDeps, signal: AbortSignal): Promise<DrainResult> {
  const sent: OutboxOp[] = []
  const parked: OutboxOp[] = []
  for (;;) {
    if (signal.aborted) return { sent, parked, stopped: "aborted" }
    const op = await deps.next()
    if (!op) return { sent, parked, stopped: "empty" }

    let res = await deps.send(op)
    let outcome = classify(res)
    if (outcome === "auth") {
      // 401: refresh once and retry; a second failure parks it and the user is asked to sign in again
      outcome = (await deps.refreshAuth()) ? classify((res = await deps.send(op))) : "permanent"
      if (outcome === "auth") outcome = "permanent"
    }

    if (outcome === "ok") {
      await deps.confirm(op)
      sent.push(op)
      continue
    }
    const message = res.error?.message ?? `HTTP ${res.status}`
    if (outcome === "transient") {
      await deps.bump(op, message)
      return { sent, parked, stopped: "transient", retryInMs: backoffMs(op.attempts) }
    }
    parked.push(...(await deps.park(op, message)))
  }
}
