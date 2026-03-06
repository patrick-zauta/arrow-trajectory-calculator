import { describe, expect, it } from "vitest"
import { estimateArrowSpeed } from "../lib/setupEstimator"
import { createDefaultState, useAppStore } from "../store/useAppStore"

describe("setup estimator", () => {
  it("returns plausible and clamped speed", () => {
    const result = estimateArrowSpeed({
      bowType: "Compound",
      drawWeight_lbs: 60,
      drawLength_in: 29,
      iboSpeed_fps: null,
      efficiencyFactor: 0.85,
      arrowMass_grain: 440,
      extraMass_grain: 0,
    })

    expect(result.speed_fps).toBeGreaterThanOrEqual(20)
    expect(result.speed_fps).toBeLessThanOrEqual(1200)
    expect(result.energy_J).toBeGreaterThan(0)
  })

  it("apply action writes speed into active setup", () => {
    useAppStore.setState(createDefaultState())

    useAppStore.getState().updateSetup({ v_fps: 321.5 })

    expect(useAppStore.getState().activeSetup.v_fps).toBe(321.5)
  })
})