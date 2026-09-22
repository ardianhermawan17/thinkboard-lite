// The traceable slug (spec 5.6): h-p{page:02}-{order:02}-{6}, base32 of a hash over normalized text
// and a quantized rect. Deterministic, so re-importing the same document dedupes (RULE-16/17: the
// slug never carries viewport pixels, only the same normalized values the highlight itself stores).
import type { Rect } from "@shared/utils/geometry"

// Crockford base32, no padding: readable in a URL/markdown anchor, unambiguous 0/O and 1/I/L.
const BASE32_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"

function base32(bytes: Uint8Array, length: number): string {
  let bits = 0
  let value = 0
  let out = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5 && out.length < length) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
    if (out.length >= length) break
  }
  return out.padEnd(length, "0")
}

// Quantizing to 4 decimal places (page-relative 0-1) means a float jitter of <0.00005 never changes
// the slug, while two genuinely different rects still hash differently.
const quantize = (n: number) => Math.round(n * 10000) / 10000

function canonicalRect(rect: Rect): string {
  return [rect.x, rect.y, rect.w, rect.h].map(quantize).join(",")
}

/**
 * `h-p{page:02}-{order:02}-{6}`. `order` is the caller's responsibility (see analyze.json NEW-1:
 * reading-order rank among the page's existing highlights, not insertion order) -- this function only
 * formats and hashes, so it stays a pure, easily-tested unit.
 */
export async function highlightSlug(text: string, rect: Rect, page: number, order: number): Promise<string> {
  const payload = `${text.normalize("NFC")}|${canonicalRect(rect)}`
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload))
  const hash = base32(new Uint8Array(digest), 6)
  const pad2 = (n: number) => String(n).padStart(2, "0")
  return `h-p${pad2(page)}-${pad2(order)}-${hash}`
}
