import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { WorkspaceProvider, useWorkspaceContext } from "."

describe("workspace context (g1)", () => {
  it("hands profileId and sessionId to a consumer inside the provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WorkspaceProvider profileId="p1" sessionId="s1">
        {children}
      </WorkspaceProvider>
    )
    const { result } = renderHook(() => useWorkspaceContext(), { wrapper })
    expect(result.current).toMatchObject({ profileId: "p1", sessionId: "s1", page: 1 })
    expect(typeof result.current.reportPage).toBe("function")
  })

  it("mirrors the page the document view reports (033)", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WorkspaceProvider profileId="p1" sessionId="s1">
        {children}
      </WorkspaceProvider>
    )
    const { result } = renderHook(() => useWorkspaceContext(), { wrapper })
    act(() => result.current.reportPage(4))
    expect(result.current.page).toBe(4)
  })

  it("throws outside a provider rather than returning a wrong default", () => {
    expect(() => renderHook(() => useWorkspaceContext())).toThrow(/WorkspaceProvider/)
  })
})
