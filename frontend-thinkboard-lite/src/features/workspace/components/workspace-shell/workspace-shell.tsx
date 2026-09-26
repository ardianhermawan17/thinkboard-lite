"use client"

import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { OfflineBanner } from "@feature/sync/components/offline-banner"
import { motion, rise, riseChild, stagger } from "@shared/lib/motion"
import { WorkspaceProvider } from "@shared/providers/workspace-provider"
import { AuthGuard } from "../auth-guard"
import { AppHeader } from "../app-header"
import { Members } from "../members"
import { PersonaEditor } from "../persona-editor"
import { Button } from "@shared/components/ui/button"
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
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
          <motion.p
            variants={riseChild}
            className="inline-flex w-max items-center gap-2 rounded-pill border border-border bg-card/70 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            New workspace
          </motion.p>
          <motion.div variants={riseChild}>
            <h1 className="mt-4 text-2xl font-medium tracking-tight">Start a workspace</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Name it, give it a title, and say what it is for. Your team gets a new one.</p>
          </motion.div>
          <motion.form
            variants={riseChild}
            className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft"
            onSubmit={(e) => {
              e.preventDefault()
              void create(new FormData(e.currentTarget))
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="ws-name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="ws-name" name="name" placeholder="e.g. Pilot" required />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="ws-title" className="text-sm font-medium">
                  Title
                </label>
                <Input id="ws-title" name="title" placeholder="e.g. Cost review" required />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="ws-goal" className="text-sm font-medium">
                  Goal
                </label>
                <Textarea id="ws-goal" name="goal" placeholder="What is this workspace for?" required />
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" className="group/cta mt-5 h-11 w-full justify-between rounded-pill ps-5 pe-1.5">
              <span>Create workspace</span>
              <span className="flex size-8 items-center justify-center rounded-pill bg-primary-foreground/15 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-px">
                <ArrowRight className="size-4" />
              </span>
            </Button>
          </motion.form>
        </motion.div>
      </div>
    )
  }

  return (
    <WorkspaceProvider profileId={profileId} sessionId={sessionId}>
      {/* One orchestrated open (frontend-design: a single staggered reveal reads better than scattered
          micro-interactions). Motion is DOM-only; the canvases inside stay untouched. */}
      <motion.div className="flex min-h-svh flex-col" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={rise}>
          <AppHeader />
          <OfflineBanner />
        </motion.div>
        <motion.div variants={rise} className="flex min-h-0 flex-1">
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
        <aside className="w-80 shrink-0 border-s border-border bg-sidebar/30 p-4">
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
      </motion.div>
      </motion.div>
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
