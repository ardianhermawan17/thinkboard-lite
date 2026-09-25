"use client"

import { use } from "react"
import dynamic from "next/dynamic"

// g6: client-only, no SSR data dependency (ffa §3.1); the page is only these imports and the route param.
const WorkspaceShell = dynamic(() => import("@feature/workspace/components/workspace-shell").then((m) => m.WorkspaceShell), { ssr: false })
// 025: the document composition is app-level (I3); it composes document + highlight through renderPage.
const WorkspaceDocument = dynamic(() => import("./workspace-document").then((m) => m.WorkspaceDocument), { ssr: false })

export default function Page({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params)
  return (
    <WorkspaceShell workspaceId={workspaceId}>
      <WorkspaceDocument sessionId={workspaceId} />
    </WorkspaceShell>
  )
}
