"use client"

import { ChevronRight } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { RailHandle } from "@shared/components/template/rail-handle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { cn } from "@shared/lib/utils"
import { Members } from "../members"
import { PersonaEditor } from "../persona-editor"
import { usePeopleRail } from "./use-people-rail"

/**
 * 043: the people rail — who is on the team, and the two personas. It folds from the chevron beside its tabs and
 * slides away, leaving a thin handle to pull it back; the document takes the freed width. Only the container's width
 * and the panel's transform move, so a frozen transition (a background tab) still lands on the right state; the
 * folded panel is inert, not merely off-screen. The state lives in the shared workspace context, because the shell
 * owns this rail and the document view owns the notes one.
 */
export function PeopleRail() {
  const { visible, setVisible } = usePeopleRail()

  return (
    <aside
      data-testid="people-rail"
      className={cn(
        "relative shrink-0 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible ? "w-80" : "w-11"
      )}
    >
      <div
        data-testid="people-rail-panel"
        aria-hidden={!visible}
        inert={!visible}
        className={cn(
          "flex h-full w-80 flex-col border-s border-border bg-sidebar/30 p-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Tabs defaultValue="members">
          <div className="flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="personas">Personas</TabsTrigger>
            </TabsList>
            <Button size="icon-sm" variant="ghost" aria-label="Hide the people rail" title="Hide the people rail" onClick={() => setVisible(false)}>
              <ChevronRight aria-hidden />
            </Button>
          </div>
          <TabsContent value="members" className="pt-3">
            <Members />
          </TabsContent>
          <TabsContent value="personas" className="pt-3">
            <PersonaEditor />
          </TabsContent>
        </Tabs>
      </div>
      <div
        aria-hidden={visible}
        inert={visible}
        className={cn(
          "absolute inset-y-0 end-0 w-11 transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          visible ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <RailHandle label="People" onExpand={() => setVisible(true)} />
      </div>
    </aside>
  )
}
