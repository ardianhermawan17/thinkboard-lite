"use client"

import { SyncStatusPill } from "@feature/sync/components/sync-status-pill"
import { ExportWorkspace } from "../export-workspace"
import { Button } from "@shared/components/ui/button"
import { Switch } from "@shared/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@shared/components/ui/toggle-group"
import { useAppHeader } from "./use-app-header"

export function AppHeader() {
  const { teamName, mode, setMode, offline, setOffline, dark, setDark, signOut } = useAppHeader()

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-4 py-2 backdrop-blur-md">
      <h1 className="min-w-0 truncate text-sm font-medium tracking-tight">{teamName ?? "ThinkBoard"}</h1>
      <SyncStatusPill />
      {/* A segmented control, not tabs: the mode picks a pipeline stage, it does not reveal a panel (no dangling aria-controls). */}
      <ToggleGroup type="single" value={mode} onValueChange={(next) => next && setMode(next)} aria-label="View mode" className="ml-auto">
        <ToggleGroupItem value="planning">Planning</ToggleGroupItem>
        <ToggleGroupItem value="descriptive">Descriptive</ToggleGroupItem>
        <ToggleGroupItem value="visualize">Visualize</ToggleGroupItem>
      </ToggleGroup>
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
