"use client"

import type { ReactNode } from "react"
import { OfflineBanner } from "@feature/sync/components/offline-banner"
import { WorkspaceProvider } from "@shared/providers/workspace-provider"
import { AuthGuard } from "../auth-guard"
import { AppHeader } from "../app-header"
import { Members } from "../members"
import { PersonaEditor } from "../persona-editor"
import { Button } from "@shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card"
import { Input } from "@shared/components/ui/input"
import { Skeleton } from "@shared/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import { useWorkspaceShell } from "./use-workspace-shell"

function Body({ workspaceId, children }: { workspaceId?: string; children?: ReactNode }) {
  const { landing, redirecting, error, session, create, profileId, sessionId } = useWorkspaceShell(workspaceId)

  if (redirecting) return <Skeleton className="h-svh w-full" />

  if (landing) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>New workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                void create(new FormData(e.currentTarget))
              }}
            >
              <Input name="name" placeholder="Workspace name" required />
              <Input name="title" placeholder="Title" required />
              <Textarea name="goal" placeholder="Goal: what is this workspace for?" required />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit">Create workspace</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <WorkspaceProvider profileId={profileId} sessionId={sessionId}>
      <div className="flex min-h-svh flex-col">
        <AppHeader />
        <OfflineBanner />
        <div className="flex min-h-0 flex-1">
        {/* the document area: the app route injects the composed document view (025); a feature may not import
            document/highlight itself (I3), so this stays a slot. */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          {error && (
            <p role="alert" className="px-6 pt-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {children ?? (
            <div className="flex flex-col gap-2 p-6">
              <h2 className="text-lg font-medium">{session?.title ?? <Skeleton className="h-6 w-48" />}</h2>
              <p className="text-sm text-muted-foreground">{session?.initial_question}</p>
            </div>
          )}
        </main>
        {/* the right rail: 013 adds sheets and promotion */}
        <aside className="w-80 shrink-0 border-l p-4">
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="personas">Personas</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="pt-3">
              <Members />
            </TabsContent>
            <TabsContent value="personas" className="pt-3">
              <PersonaEditor />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      </div>
    </WorkspaceProvider>
  )
}

export function WorkspaceShell({ workspaceId, children }: { workspaceId?: string; children?: ReactNode }) {
  return (
    <AuthGuard>
      <Body workspaceId={workspaceId}>{children}</Body>
    </AuthGuard>
  )
}
