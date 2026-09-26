import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Offline",
  description: "The workspace keeps working with the network off; this page appears when a navigation cannot be served from the cache.",
}

/**
 * The service worker's offline fallback (see `src/app/sw.ts`). It is a static page, so Serwist can precache it and
 * serve it for a navigation that misses the cache — better than the browser's own error.
 */
export default function OfflinePage() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-sm text-center">
        <span className="inline-flex w-max items-center gap-2 rounded-pill border border-border bg-card/70 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          Offline
        </span>
        <h1 className="mt-5 text-2xl font-medium tracking-tight">You are offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your highlights and notes are kept on this device. Reconnect and they sync on their own.
        </p>
        <Link
          href="/w"
          className="mt-6 inline-flex h-10 items-center rounded-pill bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_10%)]"
        >
          Try again
        </Link>
      </div>
    </main>
  )
}
