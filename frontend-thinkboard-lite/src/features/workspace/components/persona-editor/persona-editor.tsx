"use client"

import type { FormEvent } from "react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { usePersonaEditor } from "./use-persona-editor"

function PersonaForm(props: {
  legend: string
  name?: string
  prompt?: string
  readOnly?: boolean
  onSave: (form: FormData) => Promise<void>
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void props.onSave(new FormData(e.currentTarget))
  }
  return (
    // key: the defaults refresh when the pulled persona changes
    <form key={`${props.name}|${props.prompt}`} onSubmit={submit} className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <fieldset disabled={props.readOnly} className="flex flex-col gap-3">
        <legend className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{props.legend}</legend>
        {props.readOnly && <p className="text-xs text-muted-foreground">Only the workspace leader can change this.</p>}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Name</span>
          <Input name="name" placeholder="e.g. Cost reviewer" defaultValue={props.name} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium">Prompt</span>
          <Textarea name="prompt" placeholder="How should this persona read the document?" defaultValue={props.prompt} required className="min-h-24" />
        </label>
        {!props.readOnly && (
          <Button type="submit" size="sm" className="self-start">
            Save
          </Button>
        )}
      </fieldset>
    </form>
  )
}

export function PersonaEditor() {
  const { iAmLeader, teamPersona, userPersona, saveTeam, saveMine } = usePersonaEditor()

  return (
    <div className="flex flex-col gap-5">
      <PersonaForm
        legend={iAmLeader ? "Workspace persona" : "Workspace persona (leader only)"}
        name={teamPersona?.name}
        prompt={teamPersona?.guard_prompt}
        readOnly={!iAmLeader}
        onSave={saveTeam}
      />
      <PersonaForm legend="My persona" name={userPersona?.name} prompt={userPersona?.system_prompt} onSave={saveMine} />
    </div>
  )
}
