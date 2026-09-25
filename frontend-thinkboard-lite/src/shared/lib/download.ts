// A user-initiated file save: the one place a blob URL is created and revoked (027). Pure DOM, no state.
export function downloadBytes(bytes: Uint8Array, filename: string, type = "application/zip"): void {
  const url = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
