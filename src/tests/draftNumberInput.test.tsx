import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DraftNumberInput } from "../components/DraftNumberInput"

describe("DraftNumberInput", () => {
  it("does not commit intermediate typing until blur", () => {
    const onCommit = vi.fn()

    render(<DraftNumberInput value={440} onCommit={onCommit} />)
    const input = screen.getByRole("textbox")

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "2" } })
    expect(onCommit).not.toHaveBeenCalled()

    fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledWith(2)
  })

  it("allows empty draft and commits null when configured", () => {
    const onCommit = vi.fn()

    render(<DraftNumberInput value={1.23} onCommit={onCommit} allowEmpty />)
    const input = screen.getAllByRole("textbox")[1]

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "" } })
    fireEvent.blur(input)

    expect(onCommit).toHaveBeenCalledWith(null)
  })
})
