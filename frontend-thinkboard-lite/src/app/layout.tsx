import type { Metadata, Viewport } from "next"
import { Geist_Mono, IBM_Plex_Sans } from "next/font/google"

import "./globals.css"
import { LibraryProvider } from "@shared/providers"
import { cn } from "@shared/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

/**
 * The document identity Lighthouse asked for (2026-09-26): a title, a description, an app name, and a theme colour
 * pair so the browser chrome matches the workspace in light and dark. `manifest.ts` and `robots.ts` sit beside this
 * file and are served by Next at /manifest.webmanifest and /robots.txt.
 */
export const metadata: Metadata = {
  applicationName: "ThinkBoard Lite",
  title: { default: "ThinkBoard Lite — collaborative PDF review", template: "%s · ThinkBoard Lite" },
  description:
    "A local-first workspace for reviewing a PDF together: highlight, attach a note, and reach a conclusion — it keeps working with the network off.",
  // Installable: a standalone window on a tablet, and an iOS home-screen icon (apple-touch-icon).
  appleWebApp: { capable: true, title: "ThinkBoard", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", ibmPlexSans.variable)}
    >
      <body>
        <LibraryProvider>{children}</LibraryProvider>
      </body>
    </html>
  )
}
