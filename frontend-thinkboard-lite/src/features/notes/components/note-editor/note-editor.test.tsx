import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@feature/entities/repository/note-repository", () => ({
  insertNote: vi.fn().mockResolvedValue({ id: "note-1" }),
  updateNote: vi.fn().mockResolvedValue(undefined),
}))

import { NoteEditor } from "./note-editor"

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("NoteEditor", () => {
  it("g1: switching from Ketik to Tulis tangan keeps the same text", () => {
    render(<NoteEditor highlightId={"highlight-1" as never} profileId={"profile-1" as never} note={undefined} />)

    fireEvent.change(screen.getByPlaceholderText("Write a note…"), { target: { value: "budget notes" } })
    fireEvent.mouseDown(screen.getByText("Tulis tangan"))

    const field = screen.getByPlaceholderText("Write with your pen. Text appears as you go.") as HTMLTextAreaElement
    expect(field.value).toBe("budget notes")
  })

  it("g2/I26: the handwriting tab is a plain textarea with spellCheck off, never contenteditable", () => {
    render(<NoteEditor highlightId={"highlight-1" as never} profileId={"profile-1" as never} note={undefined} />)
    fireEvent.mouseDown(screen.getByText("Tulis tangan"))

    const field = screen.getByPlaceholderText("Write with your pen. Text appears as you go.")
    expect(field.tagName).toBe("TEXTAREA")
    expect(field.getAttribute("spellcheck")).toBe("false")
    expect(field.getAttribute("contenteditable")).toBeNull()
  })
})
