export type WorkspaceContextValue = {
  profileId: string | null
  sessionId: string | null
  /** 033: the page the document view is showing. It mirrors the viewport slice, which features outside `document` may not read (I3). */
  page: number
  /** The document view reports its current page here; presence uses it for the leader-drawing check (015 g4). */
  reportPage: (page: number) => void
}
