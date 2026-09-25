"use client"

import { SyncStatusPill } from "@feature/sync/components/sync-status-pill"
import { ExportWorkspace } from "../export-workspace"
import { Button } from "@shared/components/ui/button"
import { Switch } from "@shared/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { useAppHeader } from "./use-app-header"

export function AppHeader() {
  const { teamName, mode, setMode, offline, setOffline, dark, setDark, signOut } = useAppHeader()

  return (
    <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <h1 className="min-w-0 truncate text-sm font-medium">{teamName ?? "ThinkBoard"}</h1>
      <SyncStatusPill />
      <Tabs value={mode} onValueChange={setMode} className="ml-auto">
        <TabsList>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="descriptive">Descriptive</TabsTrigger>
          <TabsTrigger value="visualize">Visualize</TabsTrigger>
        </TabsList>
      </Tabs>
      <label className="flex items-center gap-2 text-xs">
        Work offline
        <Switch checked={offline} onCheckedChange={setOffline} aria-label="Work offline" />
      </label>
      <label className="flex items-center gap-2 text-xs">
        Dark
        <Switch checked={dark} onCheckedChange={setDark} aria-label="Dark theme" />
      </label>
      <ExportWorkspace />
      <Button size="sm" variant="ghost" onClick={() => void signOut()}>
        Sign out
      </Button>
    </header>
  )
}
