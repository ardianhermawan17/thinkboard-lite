"use client"

import { Button } from "@shared/components/ui/button"
import { Switch } from "@shared/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { useAppHeader } from "./use-app-header"

export function AppHeader() {
  const { teamName, syncLabel, mode, setMode, dark, setDark, signOut } = useAppHeader()

  return (
    <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <h1 className="min-w-0 truncate text-sm font-medium">{teamName ?? "ThinkBoard"}</h1>
      <span role="status" className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
        {syncLabel}
      </span>
      <Tabs value={mode} onValueChange={setMode} className="ml-auto">
        <TabsList>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="descriptive">Descriptive</TabsTrigger>
          <TabsTrigger value="visualize">Visualize</TabsTrigger>
        </TabsList>
      </Tabs>
      <label className="flex items-center gap-2 text-xs">
        Dark
        <Switch checked={dark} onCheckedChange={setDark} aria-label="Dark theme" />
      </label>
      <Button size="sm" variant="ghost" onClick={() => void signOut()}>
        Sign out
      </Button>
    </header>
  )
}
