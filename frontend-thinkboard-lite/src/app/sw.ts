/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker"
import { disableNavigationPreload, isNavigationPreloadSupported, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/*
 * Navigation preload, off on purpose.
 *
 * Preload races the network request against worker boot, a latency win online — but offline it hands the navigation
 * a failed preload response instead of letting the cache answer, and an offline reload paints a blank page. Serwist
 * only ever *enables* preload; it never disables one, and the setting lives on the registration, so a worker that
 * once enabled it keeps it until something turns it off. This app is local-first: the cache must win.
 */
if (isNavigationPreloadSupported()) self.addEventListener("activate", () => disableNavigationPreload())

/*
 * The precache manifest is injected at build time; `/w` and `/~offline` are named in next.config's
 * `additionalPrecacheEntries` because documents are not part of the build's static-asset manifest. The app's own
 * offline mode (OPFS bytes, the Dexie outbox) is task 016 and is untouched here.
 *
 * `navigateFallback` is what makes an offline deep link work. The app is client-rendered: its shell boots and its
 * router reads the path, so serving the shell for ANY navigation the precache cannot answer directly is correct —
 * `/w/[workspaceId]` opened offline renders the workspace from the local database rather than a browser error. The
 * previewer `/w` itself is answered by the precache route first; this covers every other path.
 */
new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  precacheOptions: {
    navigateFallback: "/w",
    navigateFallbackDenylist: [/^\/api\//, /\/[^/]+\.[^/]+$/],
  },
  runtimeCaching: defaultCache,
}).addEventListeners()
