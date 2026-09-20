import type { LocalManifestRow, RemoteEvent } from "@feature/entities"
import { describe, expect, it, vi } from "vitest"
import { diffManifest, reconcile, type ReconcileDeps } from "./manifest-diff"

const local = (id: string, updatedAt: string, pending = false): LocalManifestRow => ({ id, updatedAt, pending })
const remote = (id: string, updated_at: string) => ({ id, updated_at })
const T1 = "2026-09-20T10:00:00+00:00"
const T2 = "2026-09-20T11:00:00+00:00"

describe("diffManifest", () => {
  it("finds stale, missing and gone rows", () => {
    const d = diffManifest([local("a", T1), local("b", T1), local("c", T1)], [remote("a", T2), remote("b", T1), remote("d", T1)])
    expect(d).toEqual({ stale: ["a"], missing: ["d"], gone: ["c"] })
  })

  it("never refetches or deletes a row with an unsent local change (RULE-13)", () => {
    const d = diffManifest([local("a", T1, true), local("z", T1, true)], [remote("a", T2)])
    expect(d).toEqual({ stale: [], missing: [], gone: [] })
  })
})

function deps(over: Partial<ReconcileDeps> & { manifests?: Record<string, { rows: { id: string; updated_at: string }[]; complete: boolean }>; locals?: Record<string, LocalManifestRow[]> }) {
  const applied: RemoteEvent[][] = []
  const d: ReconcileDeps = {
    fetchManifest: async (table) => over.manifests?.[table] ?? { rows: [], complete: true },
    fetchByIds: vi.fn(async (_t: string, ids: string[]) => ids.map((id) => ({ id, updated_at: T2 }))),
    local: async (table) => over.locals?.[table] ?? [],
    apply: async (events) => void applied.push(events),
    ...over,
  }
  return { d, applied }
}

describe("reconcile (g4)", () => {
  it("delete detection: a highlight that vanished on the server is deleted locally", async () => {
    const { d, applied } = deps({ manifests: { highlights: { rows: [remote("a", T1)], complete: true } }, locals: { highlights: [local("a", T1), local("gone", T1)] } })
    const r = await reconcile(d, ["art"])
    expect(r.deleted).toBe(1)
    expect(applied[0]).toEqual([{ type: "DELETE", table: "highlights", record: null, oldRecord: { id: "gone" } }])
  })

  it("F8: notes have their own manifest, so a note deleted while offline leaves Dexie too", async () => {
    const { d, applied } = deps({ manifests: { highlight_notes: { rows: [], complete: true } }, locals: { notes: [local("n1", T1)] } })
    await reconcile(d, ["art"])
    expect(applied[1]).toEqual([{ type: "DELETE", table: "highlight_notes", record: null, oldRecord: { id: "n1" } }])
  })

  it("F3: a manifest that hit the page cap deletes NOTHING, however many rows look absent", async () => {
    const { d, applied } = deps({
      manifests: { highlights: { rows: [remote("a", T1)], complete: false } },
      locals: { highlights: [local("a", T1), local("b", T1), local("c", T1)] },
    })
    const r = await reconcile(d, ["art"])
    expect(r.deleted).toBe(0)
    expect(r.incomplete).toEqual(["highlights"])
    expect(applied.flat().some((e) => e.type === "DELETE")).toBe(false)
  })

  it("fetches only what is stale or missing, in one batch per table", async () => {
    const { d, applied } = deps({
      manifests: { highlights: { rows: [remote("a", T2), remote("b", T1), remote("new", T1)], complete: true } },
      locals: { highlights: [local("a", T1), local("b", T1)] },
    })
    await reconcile(d, ["art"])
    expect(d.fetchByIds).toHaveBeenCalledWith("highlights", ["a", "new"])
    expect(applied[0].map((e) => e.type)).toEqual(["INSERT", "INSERT"])
  })

  it("does nothing for a workspace with no artifacts (an empty scope must not look like an empty server)", async () => {
    const { d, applied } = deps({ locals: { highlights: [local("a", T1)] } })
    expect(await reconcile(d, [])).toEqual({ fetched: 0, deleted: 0, incomplete: [] })
    expect(applied).toHaveLength(0)
  })
})
