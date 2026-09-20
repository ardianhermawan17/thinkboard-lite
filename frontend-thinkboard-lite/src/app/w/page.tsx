"use client"

import dynamic from "next/dynamic"

// g6: client-only, no SSR data dependency (ffa §3.1); the page is only this import.
const WorkspaceShell = dynamic(() => import("@feature/workspace/components/workspace-shell").then((m) => m.WorkspaceShell), { ssr: false })

export default function Page() {
  return <WorkspaceShell />
}
