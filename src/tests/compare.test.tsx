import { fireEvent, render, screen } from "@testing-library/react"
import { HashRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { ComparePage } from "../pages/ComparePage"

describe("compare page", () => {
  it("renders two setups and metrics table", () => {
    render(
      <HashRouter>
        <ComparePage />
      </HashRouter>,
    )

    expect(screen.getAllByText("Setup A").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Setup B").length).toBeGreaterThan(0)
    expect(screen.getByRole("heading", { name: /Kennwerte/, level: 3 })).toBeInTheDocument()
  })

  it("duplicates setup A", () => {
    render(
      <HashRouter>
        <ComparePage />
      </HashRouter>,
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Setup A duplizieren" })[0])

    expect(screen.getAllByText("Setup C").length).toBeGreaterThan(0)
  })
})
