import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { Button } from "@shared/components/ui/button"

afterEach(cleanup)

describe("Button (jsdom)", () => {
  it("renders an accessible button with its label", () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy()
  })
})
