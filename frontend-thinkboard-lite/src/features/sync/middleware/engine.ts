import {
  applyRemoteBatch,
  artifactIdsForSession,
  bootstrappedKey,
  bumpAttempts,
  confirmOp,
  getMeta,
  localManifest,
  nextQueuedOp,
  parkOp,
  putMeta,
  watchQueuedOps,
} from "@feature/entities"
import { bootstrapWorkspace } from "../bootstrap/bootstrap-workspace"
import { pullMeta } from "../bootstrap/pull-meta"
import { backoffMs } from "../outbox/backoff"
import { drainOutbox, type DrainResult } from "../outbox/push"
import { refreshAuth, sendOp } from "../outbox/send-op"
import { openChannels, type ChannelHandle } from "../realtime/channel"
import { reconcile } from "../reconcile/manifest-diff"
import { PAGE, fetchArtifacts, fetchByIds, fetchManifest, fetchRowsPage } from "../reconcile/remote"

export interface Ctx {
  teamId: string
  sessionId: string
  profileId: string
}

export interface ChannelEvents {
  onRemote(count: number): void
  onDrop(): void
}

/** Everything the engine touches is injected: the protocol's ORDER is what the tests pin down, not the network. */
export interface EngineDeps {
  bootstrap(ctx: Ctx): Promise<string[]>
  drain(signal: AbortSignal): Promise<DrainResult>
  pullMeta(ctx: Ctx): Promise<void>
  reconcile(ctx: Ctx, artifactIds: string[]): Promise<unknown>
  openChannels(ctx: Ctx, events: ChannelEvents): Promise<ChannelHandle>
  watchQueued(onCount: (queued: number) => void): () => void
  sleep(ms: number, signal: AbortSignal): Promise<void>
  now(): string
}

export type CycleResult = { ok: true; channel: ChannelHandle } | { ok: false; error: string; retryInMs: number }

const REMOTE_ONLY = new Set(["team_members", "team_personas", "user_personas"])

/** A drain, then a meta pull when a write to a non-mirrored table went out (its optimistic `meta` value is now confirmed). */
export async function drainAndRefresh(deps: EngineDeps, ctx: Ctx, signal: AbortSignal): Promise<DrainResult> {
  const result = await deps.drain(signal)
  if (result.sent.some((op) => REMOTE_ONLY.has(op.table))) await deps.pullMeta(ctx)
  return result
}

/**
 * 05 §2.5, the whole protocol: bootstrap (first open only) -> PUSH -> PULL -> RESUBSCRIBE. Pull before push and the reconcile
 * overwrites rows that have not been sent; subscribe before reconcile and events land while the manifest is in flight.
 */
export async function runSyncCycle(deps: EngineDeps, ctx: Ctx, signal: AbortSignal, events: ChannelEvents, attempt = 0): Promise<CycleResult> {
  try {
    const artifactIds = await deps.bootstrap(ctx)
    const drained = await drainAndRefresh(deps, ctx, signal)
    if (drained.stopped === "transient") return { ok: false, error: "the server is unreachable, retrying", retryInMs: drained.retryInMs ?? backoffMs(attempt) }
    if (signal.aborted) return { ok: false, error: "cancelled", retryInMs: 0 }
    await deps.pullMeta(ctx)
    await deps.reconcile(ctx, artifactIds)
    return { ok: true, channel: await deps.openChannels(ctx, events) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), retryInMs: backoffMs(attempt) }
  }
}

export const realDeps: EngineDeps = {
  bootstrap: (ctx) =>
    bootstrapWorkspace(
      {
        isDone: async (sessionId) => (await getMeta(bootstrappedKey(sessionId))) !== undefined,
        markDone: (sessionId) => putMeta(bootstrappedKey(sessionId), new Date().toISOString()),
        artifactIds: artifactIdsForSession,
        fetchArtifacts,
        fetchRowsPage,
        apply: (events) => applyRemoteBatch(events, ctx.profileId),
        pageSize: PAGE,
      },
      ctx.sessionId
    ),
  drain: (signal) => drainOutbox({ next: nextQueuedOp, send: sendOp, confirm: confirmOp, park: parkOp, bump: bumpAttempts, refreshAuth }, signal),
  pullMeta: (ctx) => pullMeta(ctx.teamId, ctx.sessionId, ctx.profileId),
  reconcile: (ctx, artifactIds) =>
    reconcile({ fetchManifest, fetchByIds, local: localManifest, apply: (events) => applyRemoteBatch(events, ctx.profileId) }, artifactIds),
  openChannels: (ctx, events) =>
    openChannels(ctx.sessionId, ctx.profileId, {
      onBatch: async (batch) => {
        await applyRemoteBatch(batch, ctx.profileId)
        events.onRemote(batch.length)
      },
      onDrop: events.onDrop,
    }),
  watchQueued: watchQueuedOps,
  sleep: (ms, signal) =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, ms)
      signal.addEventListener("abort", () => (clearTimeout(timer), resolve()), { once: true })
    }),
  now: () => new Date().toISOString(),
}
