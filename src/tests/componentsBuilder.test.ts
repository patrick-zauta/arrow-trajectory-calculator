import { describe, expect, it } from "vitest"
import { sumComponentWeight } from "../lib/componentsBuilder"
import { createDefaultState, useAppStore } from "../store/useAppStore"

describe("components builder", () => {
  it("sums component weights", () => {
    const total = sumComponentWeight([
      { id: "1", name: "A", weight_grain: 10, category: "Shaft" },
      { id: "2", name: "B", weight_grain: 15, category: "Spitze" },
    ])

    expect(total).toBe(25)
  })

  it("applies total to active setup weight", () => {
    useAppStore.setState(createDefaultState())
    useAppStore.getState().updateComponentWeightAsSetup(555)

    expect(useAppStore.getState().activeSetup.m_grain).toBe(555)
  })
})