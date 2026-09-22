import { beforeEach, describe, expect, it, vi } from "vitest"

const download = vi.fn()
const from = vi.fn(() => ({ download }))
vi.mock("@shared/lib/supabase", () => ({ getSupabase: () => ({ storage: { from } }) }))

const getOrFetch = vi.fn()
const requestPersistence = vi.fn(async () => true)
vi.mock("@shared/lib/opfs", () => ({ getOrFetch: (...a: unknown[]) => getOrFetch(...a), requestPersistence: () => requestPersistence() }))

import { downloadArtifact, loadArtifactBytes } from "@shared/lib/pdf"

const PDF = new Uint8Array([37, 80, 68, 70])
const blob = { arrayBuffer: async () => PDF.slice().buffer }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("downloadArtifact (g1)", () => {
  it("strips the bucket prefix, because storage_path holds it and the client takes the object name", async () => {
    download.mockResolvedValue({ data: blob, error: null })
    expect(await downloadArtifact("artifacts/session-1/artifact-1.pdf")).toEqual(PDF)
    expect(from).toHaveBeenCalledWith("artifacts")
    expect(download).toHaveBeenCalledWith("session-1/artifact-1.pdf")
  })

  it("throws with the path when Storage refuses, so a denied read is not mistaken for an empty document", async () => {
    download.mockResolvedValue({ data: null, error: { message: "denied" } })
    await expect(downloadArtifact("artifacts/s/a.pdf")).rejects.toThrow("Could not download artifacts/s/a.pdf: denied")
  })
})

describe("loadArtifactBytes (g1)", () => {
  it("goes through the OPFS cache keyed by profile and asks the browser to persist", async () => {
    getOrFetch.mockResolvedValue({ bytes: PDF, source: "cache" })
    const out = await loadArtifactBytes("p1", "artifacts/s/a.pdf")
    expect(out).toEqual({ bytes: PDF, source: "cache" })
    expect(getOrFetch).toHaveBeenCalledWith("p1", "artifacts/s/a.pdf", expect.any(Function))
    expect(requestPersistence).toHaveBeenCalledTimes(1)
  })

  it("the fetcher it hands to the cache is the Storage download", async () => {
    download.mockResolvedValue({ data: blob, error: null })
    getOrFetch.mockImplementation(async (_p: string, _k: string, fetcher: () => Promise<Uint8Array>) => ({ bytes: await fetcher(), source: "network" }))
    const out = await loadArtifactBytes("p1", "artifacts/s/a.pdf")
    expect(out.source).toBe("network")
    expect(download).toHaveBeenCalledWith("s/a.pdf")
  })
})
