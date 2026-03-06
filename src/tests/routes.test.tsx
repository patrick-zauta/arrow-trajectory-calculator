import { render, screen } from "@testing-library/react"
import { HashRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import App from "../App"

afterEach(() => {
  window.location.hash = ""
})

describe("app routes", () => {
  it("renders home page title for /#/home", () => {
    window.location.hash = "#/home"

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    )

    expect(screen.getByRole("heading", { name: /Start/, level: 2 })).toBeInTheDocument()
  })

  it("renders flight page title for /#/flight", () => {
    window.location.hash = "#/flight"

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    )

    expect(screen.getByRole("heading", { name: /Flugparabel/, level: 2 })).toBeInTheDocument()
  })

  it("renders aim page title for /#/aim", () => {
    window.location.hash = "#/aim"

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    )

    expect(screen.getByRole("heading", { name: /Zielhilfe Rechner/, level: 2 })).toBeInTheDocument()
  })
})
