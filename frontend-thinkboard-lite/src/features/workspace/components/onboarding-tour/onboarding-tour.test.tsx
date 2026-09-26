import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { afterEach, describe, expect, it } from "vitest"
import { initialWorkspaceState, tourReset, workspaceReducer } from "../../stores/workspace-slice"
import { TOUR_STEPS } from "./use-onboarding-tour"

import { OnboardingTour } from "./onboarding-tour"

afterEach(cleanup)

const makeStore = (tourSeen = false) =>
  configureStore({
    reducer: { workspace: workspaceReducer },
    preloadedState: { workspace: { ...initialWorkspaceState, profileId: "p1", tourSeen } },
  })

const renderTour = (store: ReturnType<typeof makeStore>) =>
  render(
    <Provider store={store}>
      <OnboardingTour />
    </Provider>
  )

describe("OnboardingTour (g1, g2)", () => {
  it("opens on the first step for a new account and walks forward", () => {
    const store = makeStore()
    renderTour(store)
    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText(TOUR_STEPS[1].title)).toBeTruthy()
    // the step counter keeps the reader oriented
    expect(screen.getByText(`2 / ${TOUR_STEPS.length}`)).toBeTruthy()
  })

  it("walks back", () => {
    renderTour(makeStore())
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeTruthy()
  })

  it("finishes on the last step, records it, and closes", () => {
    const store = makeStore()
    renderTour(store)
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText(TOUR_STEPS[TOUR_STEPS.length - 1].title)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Start reading" }))
    expect(store.getState().workspace.tourSeen).toBe(true)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("can be skipped, which also records it", () => {
    const store = makeStore()
    renderTour(store)
    fireEvent.click(screen.getByRole("button", { name: "Skip" }))
    expect(store.getState().workspace.tourSeen).toBe(true)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("does not open again once it has been seen", () => {
    renderTour(makeStore(true))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("043: reopens from the first step, not the step it was left on", () => {
    const store = makeStore()
    renderTour(store)
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.click(screen.getByRole("button", { name: "Start reading" }))
    expect(screen.queryByRole("dialog")).toBeNull()

    act(() => {
      store.dispatch(tourReset())
    })

    expect(screen.getByText(TOUR_STEPS[0].title)).toBeTruthy()
    expect(screen.getByText(`1 / ${TOUR_STEPS.length}`)).toBeTruthy()
  })
})
