import type { MetadataRoute } from "next"

/**
 * The web app manifest (Next serves it at /manifest.webmanifest). It is what makes the workspace installable on a
 * tablet — the pilot's device — and gives the OS a stable identity, colours and a standalone window.
 *
 * `id: "/"` pins the installed app's identity so a later change to `start_url` does not look like a new app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ThinkBoard Lite",
    short_name: "ThinkBoard",
    description: "A local-first workspace for reviewing a PDF together: highlight, attach a note, and reach a conclusion.",
    start_url: "/w",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "en",
    dir: "ltr",
    background_color: "#f7f8f9",
    theme_color: "#191c20",
    categories: ["productivity", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
