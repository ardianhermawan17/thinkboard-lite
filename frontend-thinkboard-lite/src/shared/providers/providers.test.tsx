import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { LibraryProvider } from "./index"

// next-themes asks the browser for the system colour scheme; jsdom has no matchMedia.
beforeEach(() => {
  window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = ""
})

describe("LibraryProvider (g3)", () => {
  it.each(["light", "dark"])("renders the whole provider tree in %s", async (theme) => {
    localStorage.setItem("theme", theme)
    render(
      <LibraryProvider>
        <p>content</p>
      </LibraryProvider>
    )
    expect(await screen.findByText("content")).toBeTruthy()
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark"))
  })

  it("mounts exactly one Toaster", async () => {
    render(
      <LibraryProvider>
        <p>content</p>
      </LibraryProvider>
    )
    await screen.findByText("content")
    expect(document.querySelectorAll('section[aria-label^="Notifications"]')).toHaveLength(1)
  })
})
