import type { NextConfig } from "next"
import withSerwistInit from "@serwist/next"

// Serwist is a webpack plugin, so it is DISABLED in dev (Turbopack): service-worker bugs surface only in a
// production build, which therefore runs `next build --webpack` (see the build script). 01 §11 #9, 04 §11 #9.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
