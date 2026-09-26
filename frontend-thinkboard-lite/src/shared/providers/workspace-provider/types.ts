export type WorkspaceContextValue = {
  profileId: string | null
  sessionId: string | null
  /** 033: the page the document view is showing. It mirrors the viewport slice, which features outside `document` may not read (I3). */
  page: number
  /** The document view reports its current page here; presence uses it for the leader-drawing check (015 g4). */
  reportPage: (page: number) => void
  /** 043: whether the notes rail is showing. A feature may not read another feature's slice (I3), and the app route may not read the store (I4). */
  notesVisible: boolean
  setNotesVisible: (visible: boolean) => void
  /** 043: whether the people (members + personas) rail is showing. */
  peopleVisible: boolean
  setPeopleVisible: (visible: boolean) => void
}
