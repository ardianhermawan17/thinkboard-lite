import { configureStore } from "@reduxjs/toolkit"
import { cleanup, render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { Provider } from "react-redux"
import { afterEach, describe, expect, it } from "vitest"
import { Button } from "@shared/components/ui/button"
import { DisabledWhenOffline, OfflineBanner } from "."
import { initialSyncState, syncReducer } from "../../stores/sync-slice"
import type { SyncState } from "../../types/redux"

function wrap(ui: ReactElement, sync: Partial<Omit<SyncState, "ui">> & { ui?: Partial<SyncState["ui"]> } = {}) {
  const store = configureStore({
    reducer: { sync: syncReducer },
    preloadedState: { sync: { ...initialSyncState, ...sync, ui: { ...initialSyncState.ui, ...(sync.ui ?? {}) } } },
  })
  return render(<Provider store={store}>{ui}</Provider>)
}

afterEach(cleanup)

describe("OfflineBanner (g2, g3)", () => {
  it("is hidden while collaborating", () => {
    wrap(<OfflineBanner />)
    expect(screen.queryByTestId("offline-banner")).toBeNull()
  })

  it("offers the explicit resume when the network is back, with N from the outbox", () => {
    wrap(<OfflineBanner />, { phase: "offline", ui: { pendingCount: 3, lastSyncedAt: "2026-09-25T01:00:00Z" } })
    expect(screen.getByTestId("offline-banner").textContent).toContain("Back online · 3 changes to sync")
    expect(screen.getByTestId("offline-banner").textContent).toContain("Last synced")
    expect(screen.getByRole("button", { name: "Sync now" })).toBeTruthy()
  })

  it("reports the queue and offers no resume while the network is genuinely down", () => {
    wrap(<OfflineBanner />, { phase: "offline", ui: { pendingCount: 1, networkDown: true } })
    expect(screen.getByTestId("offline-banner").textContent).toContain("Offline · 1 change to sync")
    expect(screen.queryByRole("button", { name: "Sync now" })).toBeNull()
  })

  it("shows lastSyncedAt as never before the first successful cycle", () => {
    wrap(<OfflineBanner />, { phase: "offline" })
    expect(screen.getByTestId("offline-banner").textContent).toContain("Last synced never")
  })
})

describe("DisabledWhenOffline (g2)", () => {
  it("leaves a control alone while collaborating", () => {
    wrap(
      <DisabledWhenOffline>
        <Button>Share to group</Button>
      </DisabledWhenOffline>
    )
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false)
  })

  it("disables the control and explains why while offline — never hides it", () => {
    wrap(
      <DisabledWhenOffline reason="You are working offline">
        <Button>Share to group</Button>
      </DisabledWhenOffline>,
      { phase: "offline" }
    )
    const button = screen.getByRole("button", { name: "Share to group" }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.title).toBe("You are working offline")
    expect(button.getAttribute("aria-disabled")).toBe("true")
  })
})
