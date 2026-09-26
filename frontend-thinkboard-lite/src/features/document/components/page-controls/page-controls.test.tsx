import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { afterEach, describe, expect, it } from "vitest"
import { initialViewportState, viewportReducer } from "../../stores/viewport-slice"

import { PageControls } from "./page-controls"

afterEach(cleanup)

function makeStore(page = 1, pageCount = 3) {
  return configureStore({
    reducer: { viewport: viewportReducer },
    preloadedState: { viewport: { ...initialViewportState, page, ui: { pageCount } } },
  })
}

const renderWith = (store: ReturnType<typeof makeStore>) =>
  render(
    <Provider store={store}>
      <PageControls />
    </Provider>
  )

describe("PageControls (g1)", () => {
  it("shows the page cursor and the document length, and advances the page", () => {
    const store = makeStore(1, 30)
    renderWith(store)
    expect(screen.getByTestId("page-indicator").textContent).toBe("Page 1 of 30")

    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(store.getState().viewport.page).toBe(2)
    expect(screen.getByTestId("page-indicator").textContent).toBe("Page 2 of 30")

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }))
    expect(store.getState().viewport.page).toBe(1)
  })

  it("disables the step that would leave the document", () => {
    const store = makeStore(1, 2)
    renderWith(store)
    expect((screen.getByRole("button", { name: "Previous page" }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement).disabled).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: "Next page" }))
    expect(store.getState().viewport.page).toBe(2)
    expect((screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("turns the page a quarter turn per click", () => {
    const store = makeStore()
    renderWith(store)
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90 degrees" }))
    expect(store.getState().viewport.rotation).toBe(90)
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90 degrees" }))
    expect(store.getState().viewport.rotation).toBe(180)
  })

  it("shows no length until a document is open", () => {
    const store = makeStore(1, 0)
    renderWith(store)
    expect(screen.getByTestId("page-indicator").textContent).toBe("Page 1")
  })

  it("043: the arrow keys turn the page, and yield to an open dialog or a text field", () => {
    const store = makeStore(1, 30)
    renderWith(store)

    fireEvent.keyDown(document.body, { key: "ArrowRight" })
    expect(store.getState().viewport.page).toBe(2)
    fireEvent.keyDown(document.body, { key: "ArrowRight" })
    expect(store.getState().viewport.page).toBe(3)
    fireEvent.keyDown(document.body, { key: "ArrowLeft" })
    expect(store.getState().viewport.page).toBe(2)

    // an open dialog owns the arrows (Radix's sheet is role=dialog, not aria-modal)
    const dialog = document.createElement("div")
    dialog.setAttribute("role", "dialog")
    document.body.appendChild(dialog)
    fireEvent.keyDown(document.body, { key: "ArrowRight" })
    expect(store.getState().viewport.page).toBe(2)
    dialog.remove()

    // so does a text field
    const field = document.createElement("textarea")
    document.body.appendChild(field)
    fireEvent.keyDown(field, { key: "ArrowRight" })
    expect(store.getState().viewport.page).toBe(2)
    field.remove()
  })
})
