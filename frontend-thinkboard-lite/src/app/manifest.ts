import type { MetadataRoute } from "next"

/**
 * The web app manifest (Next serves it at /manifest.webmanifest). It makes the workspace installable on a tablet —
 * which is the pilot's device — and gives the OS a name, a colour and a standalone window.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ThinkBoard Lite",
    short_name: "ThinkBoard",
    description: "A local-first workspace for reviewing a PDF together: highlight, attach a note, and reach a conclusion.",
    start_url: "/w",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#0b0b0d",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  }
}
