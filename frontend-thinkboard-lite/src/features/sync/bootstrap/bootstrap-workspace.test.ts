import type { RemoteEvent } from "@feature/entities"
import { describe, expect, it, vi } from "vitest"
import { bootstrapWorkspace, type BootstrapDeps } from "./bootstrap-workspace"

const rows = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}` }))

function harness(pageSize: number, data: { highlights: { id: string }[]; highlight_notes: { id: string }[] }) {
  const store = new Map<string, RemoteEvent>() // an upsert keyed by table+id: what bulkPut does
  const meta = new Set<string>()
  const fetchRowsPage = vi.fn(async (table: "highlights" | "highlight_notes", _ids: string[], page: number) => data[table].slice(page * pageSize, (page + 1) * pageSize))
  const deps: BootstrapDeps = {
    isDone: async (s) => meta.has(s),
    markDone: async (s) => void meta.add(s),
    artifactIds: async () => ["art"],
    fetchArtifacts: async () => [{ id: "art" }],
    fetchRowsPage,
    apply: async (events) => events.forEach((e) => store.set(`${e.table}:${e.record?.id}`, e)),
    pageSize,
  }
  return { deps, store, meta, fetchRowsPage }
}

describe("bootstrap (g4)", () => {
  it("paginates every table until a short page, and writes the done flag LAST", async () => {
    const { deps, store, meta, fetchRowsPage } = harness(2, { highlights: rows("h", 5), highlight_notes: rows("n", 2) })
    await bootstrapWorkspace(deps, "s1")
    expect([...store.keys()].filter((k) => k.startsWith("highlights:"))).toHaveLength(5)
    expect(fetchRowsPage.mock.calls.filter((c) => c[0] === "highlights").map((c) => c[2])).toEqual([0, 1, 2]) // 2 + 2 + 1
    expect(fetchRowsPage.mock.calls.filter((c) => c[0] === "highlight_notes").map((c) => c[2])).toEqual([0, 1]) // a full page is followed by an empty one
    expect(meta.has("s1")).toBe(true)
  })

  it("an interrupted bootstrap writes no flag, and the rerun completes without duplicating", async () => {
    const h = harness(2, { highlights: rows("h", 5), highlight_notes: [] })
    h.fetchRowsPage.mockImplementationOnce(async () => rows("h", 2)).mockImplementationOnce(async () => {
      throw new Error("connection lost")
    })
    await expect(bootstrapWorkspace(h.deps, "s1")).rejects.toThrow("connection lost")
    expect(h.meta.has("s1")).toBe(false) // resume = start again

    h.fetchRowsPage.mockImplementation(async (table, _ids, page) => (table === "highlights" ? rows("h", 5).slice(page * 2, page * 2 + 2) : []))
    await bootstrapWorkspace(h.deps, "s1")
    expect([...h.store.keys()].filter((k) => k.startsWith("highlights:"))).toHaveLength(5) // idempotent: no duplicates
    expect(h.meta.has("s1")).toBe(true)
  })

  it("once done, a later open fetches nothing (the flag is the guard)", async () => {
    const h = harness(2, { highlights: rows("h", 3), highlight_notes: [] })
    await bootstrapWorkspace(h.deps, "s1")
    h.fetchRowsPage.mockClear()
    expect(await bootstrapWorkspace(h.deps, "s1")).toEqual(["art"])
    expect(h.fetchRowsPage).not.toHaveBeenCalled()
  })
})
