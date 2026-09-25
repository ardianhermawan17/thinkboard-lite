import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearProfileArtifacts, getOrFetch, isCacheableOffline, readCached, requestPersistence, writeCached } from "@shared/lib/opfs"

// A minimal in-memory OPFS: just the handles opfs.ts touches.
class FakeFile {
  constructor(public data = new Uint8Array()) {}
  async getFile() {
    return { arrayBuffer: async () => this.data.slice().buffer }
  }
  async createWritable() {
    return {
      write: async (b: Uint8Array) => {
        this.data = new Uint8Array(b)
      },
      close: async () => {},
    }
  }
}
class FakeDir {
  dirs = new Map<string, FakeDir>()
  files = new Map<string, FakeFile>()
  async getDirectoryHandle(name: string, o?: { create?: boolean }) {
    if (!this.dirs.has(name)) {
      if (!o?.create) throw new DOMException("missing", "NotFoundError")
      this.dirs.set(name, new FakeDir())
    }
    return this.dirs.get(name)!
  }
  async getFileHandle(name: string, o?: { create?: boolean }) {
    if (!this.files.has(name)) {
      if (!o?.create) throw new DOMException("missing", "NotFoundError")
      this.files.set(name, new FakeFile())
    }
    return this.files.get(name)!
  }
  async removeEntry(name: string) {
    if (!this.dirs.delete(name) && !this.files.delete(name)) throw new DOMException("missing", "NotFoundError")
  }
}

let root: FakeDir
const PDF = new Uint8Array([37, 80, 68, 70])
const PATH = "artifacts/session-1/artifact-1.pdf"

beforeEach(() => {
  root = new FakeDir()
  vi.stubGlobal("navigator", { storage: { getDirectory: async () => root, persist: vi.fn(async () => true) } })
})
afterEach(() => vi.unstubAllGlobals())

describe("opfs cache (g1)", () => {
  it("misses before the first write and hits after", async () => {
    expect(await readCached("p1", PATH)).toBeNull()
    await writeCached("p1", PATH, PDF)
    expect(await readCached("p1", PATH)).toEqual(PDF)
  })

  it("a second open reads the cache and never calls the network", async () => {
    const fetchBytes = vi.fn(async () => PDF)
    const first = await getOrFetch("p1", PATH, fetchBytes)
    const second = await getOrFetch("p1", PATH, fetchBytes)
    expect(first.source).toBe("network")
    expect(second).toEqual({ bytes: PDF, source: "cache" })
    expect(fetchBytes).toHaveBeenCalledTimes(1)
  })

  it("re-fetches after the browser evicts the file", async () => {
    const fetchBytes = vi.fn(async () => PDF)
    await getOrFetch("p1", PATH, fetchBytes)
    root.dirs.clear() // eviction
    const again = await getOrFetch("p1", PATH, fetchBytes)
    expect(again.source).toBe("network")
    expect(fetchBytes).toHaveBeenCalledTimes(2)
  })

  it("keys per profile: another profile never reads the first one's bytes", async () => {
    await writeCached("p1", PATH, PDF)
    expect(await readCached("p2", PATH)).toBeNull()
  })

  it("still returns the bytes when the cache write fails", async () => {
    const fail = async () => {
      throw new DOMException("full", "QuotaExceededError")
    }
    const dir = await (await root.getDirectoryHandle("artifacts", { create: true })).getDirectoryHandle("p1", { create: true })
    dir.getFileHandle = async (_n: string, o?: { create?: boolean }) => {
      if (o?.create) return fail() as never
      throw new DOMException("missing", "NotFoundError")
    }
    const out = await getOrFetch("p1", PATH, async () => PDF)
    expect(out).toEqual({ bytes: PDF, source: "network" })
  })

  it("still returns the bytes when the cache read fails", async () => {
    root.getDirectoryHandle = async () => {
      throw new DOMException("denied", "SecurityError")
    }
    const out = await getOrFetch("p1", PATH, async () => PDF)
    expect(out).toEqual({ bytes: PDF, source: "network" })
  })

  it("works without OPFS: fetches every time and caches nothing", async () => {
    vi.stubGlobal("navigator", {})
    const fetchBytes = vi.fn(async () => PDF)
    await getOrFetch("p1", PATH, fetchBytes)
    await getOrFetch("p1", PATH, fetchBytes)
    expect(fetchBytes).toHaveBeenCalledTimes(2)
  })

  it("asks the browser to persist storage, and reports false where unsupported", async () => {
    expect(await requestPersistence()).toBe(true)
    vi.stubGlobal("navigator", {})
    expect(await requestPersistence()).toBe(false)
  })
})

describe("offline wipe and slot policy (g6)", () => {
  it("clears only this profile's directory, so a shared tablet keeps no bytes of the previous user", async () => {
    await writeCached("p1", PATH, PDF)
    await writeCached("p2", PATH, PDF)
    await clearProfileArtifacts("p1")
    expect(await readCached("p1", PATH)).toBeNull()
    expect(await readCached("p2", PATH)).toEqual(PDF)
  })

  it("is a no-op when the profile never cached anything", async () => {
    await expect(clearProfileArtifacts("ghost")).resolves.toBeUndefined()
  })

  it("D-10: only the main document is cacheable offline; the leader's note copy is not", () => {
    expect(isCacheableOffline("main")).toBe(true)
    expect(isCacheableOffline("note")).toBe(false)
    expect(isCacheableOffline(null)).toBe(false)
    expect(isCacheableOffline(undefined)).toBe(false)
  })
})
