import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const insertNote = vi.fn()
const updateNote = vi.fn()
vi.mock("@feature/entities/repository/note-repository", () => ({
  insertNote: (...a: unknown[]) => insertNote(...a),
  updateNote: (...a: unknown[]) => updateNote(...a),
}))

import { useNoteEditor } from "./use-note-editor"

const PROPS = { highlightId: "highlight-1" as never, profileId: "profile-1" as never, note: undefined }

beforeEach(() => {
  vi.useFakeTimers()
  insertNote.mockReset().mockResolvedValue({ id: "note-1" })
  updateNote.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useNoteEditor", () => {
  it("coalesces a whole paragraph of keystrokes into one write (g5)", async () => {
    const { result } = renderHook(() => useNoteEditor(PROPS))

    act(() => result.current.onContentChange("H"))
    act(() => vi.advanceTimersByTime(200))
    act(() => result.current.onContentChange("He"))
    act(() => vi.advanceTimersByTime(200))
    act(() => result.current.onContentChange("Hello"))

    expect(insertNote).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(800)
      await Promise.resolve()
    })

    expect(insertNote).toHaveBeenCalledTimes(1)
    expect(insertNote).toHaveBeenCalledWith({ highlightId: "highlight-1", profileId: "profile-1", content: "Hello", inputMode: "keyboard" })
    expect(updateNote).not.toHaveBeenCalled()
  })

  it("updates an existing note by id on the second autosave", async () => {
    const { result } = renderHook(() => useNoteEditor({ ...PROPS, note: { id: "note-2", content: "existing" } as never }))

    act(() => result.current.onContentChange("existing text"))
    await act(async () => {
      vi.advanceTimersByTime(800)
      await Promise.resolve()
    })

    expect(updateNote).toHaveBeenCalledWith("note-2", { content: "existing text", inputMode: "keyboard" })
    expect(insertNote).not.toHaveBeenCalled()
  })
})
