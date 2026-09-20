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
    <form key={`${props.name}|${props.prompt}`} onSubmit={submit} className="flex flex-col gap-2">
      <fieldset disabled={props.readOnly} className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{props.legend}</legend>
        <Input name="name" placeholder="Name" defaultValue={props.name} required />
        <Textarea name="prompt" placeholder="Prompt" defaultValue={props.prompt} required />
        {!props.readOnly && <Button type="submit" size="sm">Save</Button>}
      </fieldset>
    </form>
  )
}

export function PersonaEditor() {
  const { iAmLeader, teamPersona, userPersona, saveTeam, saveMine } = usePersonaEditor()

  return (
    <div className="flex flex-col gap-6">
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
