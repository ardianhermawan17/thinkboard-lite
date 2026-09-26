export type PageControlsState = {
  page: number
  pageCount: number
  rotation: number
  canGoBack: boolean
  canGoForward: boolean
  goTo: (page: number) => void
  rotate: () => void
}
