"use client"

import { ChevronRight } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { RailHandle } from "@shared/components/template/rail-handle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Members } from "../members"
import { PersonaEditor } from "../persona-editor"
import { usePeopleRail } from "./use-people-rail"

/**
 * 043: the people rail — who is on the team, and the two personas. It folds from the chevron beside its tabs and
 * leaves a thin handle behind, so the document can take the full width. The state lives in the shared workspace
 * context, because the shell owns this rail and the document view owns the notes one.
 */
export function PeopleRail() {
  const { visible, setVisible } = usePeopleRail()

  if (!visible) return <RailHandle label="People" onExpand={() => setVisible(true)} />

  return (
    <aside className="w-80 shrink-0 border-s border-border bg-sidebar/30 p-4" data-testid="people-rail">
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
    </aside>
  )
}
