// The PDF byte cache (spec 5.3, F6): a 40 MB document wants streaming file reads, not a Dexie blob row.
// Keyed per profile (task 009 g1, confirmed 2026-09-21) so a shared tablet does not share bytes; 016 g6 still wipes it on sign out.

export type ArtifactBytes = { bytes: Uint8Array; source: "cache" | "network" }

const ROOT = "artifacts"

const supported = () => typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function"

// A storage_path holds slashes, so it is encoded into one file name; the profile gets its own directory.
async function profileDir(profileId: string, create: boolean) {
  const root = await navigator.storage.getDirectory()
  const artifacts = await root.getDirectoryHandle(ROOT, { create })
  return artifacts.getDirectoryHandle(encodeURIComponent(profileId), { create })
}

const isNotFound = (e: unknown) => e instanceof DOMException && e.name === "NotFoundError"

/** null when the file is absent (never cached, or evicted by the browser) or OPFS is unavailable. */
export async function readCached(profileId: string, storagePath: string): Promise<Uint8Array | null> {
  if (!supported()) return null
  try {
    const dir = await profileDir(profileId, false)
    const file = await (await dir.getFileHandle(encodeURIComponent(storagePath))).getFile()
    return new Uint8Array(await file.arrayBuffer())
  } catch (e) {
    if (isNotFound(e)) return null
    throw e
  }
}

export async function writeCached(profileId: string, storagePath: string, bytes: Uint8Array): Promise<void> {
  if (!supported()) return
  const dir = await profileDir(profileId, true)
  const handle = await dir.getFileHandle(encodeURIComponent(storagePath), { create: true })
  const writable = await handle.createWritable()
  await writable.write(bytes as BufferSource)
  await writable.close()
}

/**
 * g6 / F6: OPFS is not namespaced the way Dexie is, so signing out must remove this profile's directory
 * explicitly — otherwise a shared tablet leaks the previous user's PDF bytes.
 */
export async function clearProfileArtifacts(profileId: string): Promise<void> {
  if (!supported()) return
  try {
    const root = await navigator.storage.getDirectory()
    const artifacts = await root.getDirectoryHandle(ROOT, { create: false })
    await artifacts.removeEntry(encodeURIComponent(profileId), { recursive: true })
  } catch (e) {
    if (isNotFound(e)) return
    throw e
  }
}

/**
 * D-10 (defaulted): only the `main` document is cached/loaded offline. The leader's `note` copy is not cached
 * by default, and a not-yet-uploaded artifact (`slot` null) is not cacheable either.
 */
export const CACHEABLE_OFFLINE_SLOTS = ["main"] as const

export function isCacheableOffline(slot: string | null | undefined): boolean {
  return slot != null && (CACHEABLE_OFFLINE_SLOTS as readonly string[]).includes(slot)
}

/** Without this the browser may evict the PDF under storage pressure (spec 5.3). Call on first offline open. */
export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.storage?.persist !== "function") return false
  return navigator.storage.persist()
}

/**
 * Download once, then read locally: a second open never touches the network. An evicted file simply misses the cache and
 * is fetched again (v2 2.6), and `source` lets the caller say so. The cache is an optimisation: a failed read or write
 * must never block reading the document.
 */
export async function getOrFetch(profileId: string, storagePath: string, fetchBytes: () => Promise<Uint8Array>): Promise<ArtifactBytes> {
  const cached = await readCached(profileId, storagePath).catch(() => null)
  if (cached) return { bytes: cached, source: "cache" }
  const bytes = await fetchBytes()
  try {
    await writeCached(profileId, storagePath, bytes)
  } catch {
    // ponytail: a full quota just means the next open downloads again; surface a notice if that ever proves noisy
  }
  return { bytes, source: "network" }
}
