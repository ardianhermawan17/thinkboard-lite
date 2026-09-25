export type ExportWorkspaceState = {
  canExport: boolean
  busy: boolean
  error: string | null
  exportWorkspace: () => Promise<void>
}
