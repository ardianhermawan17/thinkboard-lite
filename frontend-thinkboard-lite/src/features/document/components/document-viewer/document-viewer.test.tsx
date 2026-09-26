import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { WorkspaceProvider } from "@shared/providers/workspace-provider"
import { viewportReducer, pageChanged } from "../../stores/viewport-slice"
import { workspaceReducer } from "@feature/workspace/stores/workspace-slice"

vi.mock("next/dynamic", () => ({
  default: () => (props: Record<string, unknown>) => <div data-testid="page-stage-stub" data-page={props.pageNumber as number} />,
}))
vi.mock("@shared/components/canvas/page-stage", () => ({ PageStage: () => null }))

const artifacts = [{ id: "a1", sessionId: "s1", kind: "pdf", storagePath: "artifacts/s1/a1.pdf" }]
vi.mock("@feature/entities/queries/use-artifacts-for-session", () => ({ useArtifactsForSession: () => artifacts }))

const openPdf = vi.fn(async () => ({ numPages: 30 }))
const loadArtifactBytes = vi.fn(async () => ({ bytes: new Uint8Array(), source: "cache" }))
vi.mock("@shared/lib/pdf", () => ({ openPdf: (...a: unknown[]) => openPdf(...(a as [])), loadArtifactBytes: (...a: unknown[]) => loadArtifactBytes(...(a as [])) }))

import { DocumentViewer } from "./document-viewer"

function makeStore() {
  return configureStore({
    reducer: { workspace: workspaceReducer, viewport: viewportReducer },
    preloadedState: { workspace: { profileId: "p1", teamId: "t1", sessionId: "s1", mode: "planning" as const, tourSeen: true, ui: { error: null } } },
  })
}

afterEach(() => vi.clearAllMocks())

describe("DocumentViewer (g2 windowing, container)", () => {
  it("mounts at most three page-stage leaves for a 30-page document, centred on the cursor", async () => {
    const store = makeStore()
    render(
      <Provider store={store}>
        <WorkspaceProvider profileId="p1" sessionId="s1">
          <DocumentViewer sessionId={"s1" as import("@shared/types/domain/common").UUID<"sessions">} />
        </WorkspaceProvider>
      </Provider>
    )
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    store.dispatch(pageChanged(15))
    await act(async () => {})

    const stages = screen.getAllByTestId("page-stage-stub")
    expect(stages.length).toBeLessThanOrEqual(3)
    expect(stages.map((s) => s.dataset.page)).toEqual(["14", "15", "16"])
    // 035: the controls follow the same slice, so the cursor is visible and steppable.
    expect(screen.getByTestId("page-indicator").textContent).toBe("Page 15 of 30")
  })
})
