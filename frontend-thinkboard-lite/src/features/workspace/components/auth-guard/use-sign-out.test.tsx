import { configureStore } from "@reduxjs/toolkit"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  deleteDb: vi.fn(async () => {}),
  clearProfileArtifacts: vi.fn(async () => {}),
  signOut: vi.fn(async () => {}),
  outbox: { queued: 0, failed: 0 },
}))

vi.mock("@feature/entities", () => ({ deleteDb: mocks.deleteDb, useOutboxCount: () => mocks.outbox }))
vi.mock("@shared/lib/opfs", () => ({ clearProfileArtifacts: mocks.clearProfileArtifacts }))
vi.mock("../../utils/workspace-remote", () => ({ signOut: mocks.signOut }))

import { initialWorkspaceState, workspaceReducer } from "../../stores/workspace-slice"
import { useSignOut } from "./use-sign-out"

const store = configureStore({ reducer: { workspace: workspaceReducer }, preloadedState: { workspace: { ...initialWorkspaceState, profileId: "p1" } } })
const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

afterEach(() => {
  mocks.deleteDb.mockClear()
  mocks.clearProfileArtifacts.mockClear()
  mocks.signOut.mockClear()
  mocks.outbox = { queued: 0, failed: 0 }
})

describe("useSignOut (g6, F6)", () => {
  it("clears Dexie AND OPFS for the signed-in profile, then ends the session", async () => {
    const { result } = renderHook(() => useSignOut(), { wrapper })
    await act(async () => {
      await result.current()
    })
    expect(mocks.clearProfileArtifacts).toHaveBeenCalledWith("p1")
    expect(mocks.deleteDb).toHaveBeenCalledWith("p1")
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
  })

  it("still refuses while a write has not reached the server (silent data loss)", async () => {
    mocks.outbox = { queued: 2, failed: 0 }
    const { result } = renderHook(() => useSignOut(), { wrapper })
    let ok = true
    await act(async () => {
      ok = await result.current()
    })
    expect(ok).toBe(false)
    expect(mocks.clearProfileArtifacts).not.toHaveBeenCalled()
    expect(mocks.deleteDb).not.toHaveBeenCalled()
  })
})
