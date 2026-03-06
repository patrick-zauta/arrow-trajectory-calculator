import { render, screen } from "@testing-library/react"
import { HashRouter } from "react-router-dom"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import App from "../App"

beforeAll(async () => {
  await Promise.all([
    import("../pages/HomePage"),
    import("../pages/FlightPage"),
    import("../pages/AimPage"),
  ])
})

afterEach(() => {
  window.location.hash = ""
})

describe("app routes", () => {
  it("renders home page title for /#/home", async () => {
    window.location.hash = "#/home"

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    )

    expect(await screen.findByRole("heading", { name: /Start/, level: 2 })).toBeInTheDocument()
  })

  it("renders flight page title for /#/flight", async () => {
    window.location.hash = "#/flight"

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    )

    expect(await screen.findByRole("heading", { name: /Flugparabel/, level: 2 })).toBeInTheDocument()
  })

  it("renders aim page title for /#/aim", async () => {
    window.location.hash = "#/aim"

    render(
      <HashRouter>
        <App />
      </HashRouter>,
    )

    expect(await screen.findByRole("heading", { name: /Zielhilfe Rechner/, level: 2 })).toBeInTheDocument()
  })
})
