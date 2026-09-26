import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

// Serwist is a webpack plugin, so it is DISABLED in dev (Turbopack): service-worker bugs surface only in a
// production build, which therefore runs `next build --webpack` (see the build script). 01 §11 #9, 04 §11 #9.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Documents are not part of the build's static-asset manifest, so name them: the app shell (`/w`, prerendered) and
  // the offline fallback that `sw.ts` wires. `fallbacks` only attaches the error plugin — it does not add these to
  // the precache — so without this list an offline reload has nothing to serve.
  additionalPrecacheEntries: ["/w", "/~offline"],
})

const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
