"use client"

import { use } from "react"
import dynamic from "next/dynamic"

// g6: client-only, no SSR data dependency (ffa §3.1); the page is only this import and the route param.
const WorkspaceShell = dynamic(() => import("@feature/workspace/components/workspace-shell").then((m) => m.WorkspaceShell), { ssr: false })

export default function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  return <WorkspaceShell workspaceId={use(params).workspaceId} />
}
