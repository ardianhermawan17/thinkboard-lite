export type ReimportPlanView = { matched: number; unanchored: number; orphans: number; missing: number }

export type ReimportReviewState = {
  open: boolean
  setOpen: (open: boolean) => void
  markdown: string
  setMarkdown: (value: string) => void
  plan: ReimportPlanView | null
  applied: number | null
  busy: boolean
  error: string | null
  apply: () => Promise<void>
}
