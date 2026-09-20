import { describe, expect, it } from "vitest"
import { stripUi } from "@shared/config/redux/persist"
import { failed, initialWorkspaceState, modeChanged, signedIn, signedOut, workspaceOpened, workspaceReducer } from "./workspace-slice"

describe("workspace slice", () => {
  it("signs in, opens a workspace, and signing out forgets the last workspace pointer (F6)", () => {
    let state = workspaceReducer(undefined, signedIn({ profileId: "p1" }))
    state = workspaceReducer(state, workspaceOpened({ teamId: "t1", sessionId: "s1", mode: "descriptive" }))
    expect(state).toMatchObject({ profileId: "p1", teamId: "t1", sessionId: "s1", mode: "descriptive" })
    expect(workspaceReducer(state, signedOut())).toEqual(initialWorkspaceState)
  })

  it("keeps the mode when a workspace opens without one, and switches it on demand", () => {
    const opened = workspaceReducer(workspaceReducer(undefined, modeChanged("visualize")), workspaceOpened({ teamId: "t", sessionId: "s" }))
    expect(opened.mode).toBe("visualize")
  })

  it("keeps errors under ui, so they are stripped and never rehydrate stale (I16)", () => {
    const state = workspaceReducer(undefined, failed("boom"))
    expect(state.ui.error).toBe("boom")
    const persisted = stripUi.in(state as never, "workspace", {}) as Record<string, unknown>
    expect("ui" in persisted).toBe(false)
    expect(persisted.profileId).toBeNull()
  })
})
