import { act, renderHook } from "@testing-library/react"
import { useEffect, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ toast: vi.fn() }))
vi.mock("sonner", () => ({ toast: mocks.toast }))

import { WorkspaceProvider, useWorkspaceContext } from "@shared/providers/workspace-provider"
import { useNotesNudge } from "./use-notes-nudge"

afterEach(() => vi.clearAllMocks())

/** 043: the rail starts visible, so the hidden case closes it first, the way the header toggle does. */
function HiddenNotes({ children }: { children: ReactNode }) {
  const { setNotesVisible } = useWorkspaceContext()
  useEffect(() => setNotesVisible(false), [setNotesVisible])
  return <>{children}</>
}

const ShownNotes = ({ children }: { children: ReactNode }) => <WorkspaceProvider profileId="p1" sessionId="s1">{children}</WorkspaceProvider>

const Hidden = ({ children }: { children: ReactNode }) => (
  <WorkspaceProvider profileId="p1" sessionId="s1">
    <HiddenNotes>{children}</HiddenNotes>
  </WorkspaceProvider>
)

describe("useNotesNudge (043)", () => {
  it("stays quiet while the notes rail is showing", () => {
    const { result } = renderHook(() => useNotesNudge(), { wrapper: ShownNotes })
    result.current("a shown highlight")
    expect(mocks.toast).not.toHaveBeenCalled()
  })

  it("points at the notes rail when it is hidden, and the action reopens it", () => {
    const { result } = renderHook(() => useNotesNudge(), { wrapper: Hidden })
    result.current("the marked sentence")

    expect(mocks.toast).toHaveBeenCalledTimes(1)
    const [title, options] = mocks.toast.mock.calls[0] as [string, { description: string; action: { label: string; onClick: () => void } }]
    expect(title).toBe("Highlight added to Notes")
    expect(options.description).toContain("the marked sentence")
    expect(options.action.label).toBe("Show notes")

    act(() => options.action.onClick())
    result.current("another mark")
    expect(mocks.toast).toHaveBeenCalledTimes(1)
  })

  it("is silent outside a workspace instead of throwing", () => {
    const { result } = renderHook(() => useNotesNudge())
    expect(() => result.current("orphan mark")).not.toThrow()
    expect(mocks.toast).not.toHaveBeenCalled()
  })
})
