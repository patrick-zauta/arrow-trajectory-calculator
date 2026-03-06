import { describe, expect, it } from "vitest"
import { findApproxPointAtDistance, simulateBallistics } from "../lib/ballistics"
import { solveAngleForTarget } from "../lib/aim"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import { DEFAULT_ADVANCED, DEFAULT_SETUP, DEFAULT_WIND } from "../store/useAppStore"

describe("aim solver and approx match", () => {
  it("solver finds angle with < 1cm error at 30m", () => {
    const result = solveAngleForTarget(DEFAULT_SETUP, DEFAULT_ADVANCED, DEFAULT_WIND, 30, 0)

    expect(Math.abs(result.error_m)).toBeLessThan(0.01)
  })

  it("approx match returns last x <= target distance", () => {
    const sim = simulateBallistics(toUserInputs(DEFAULT_SETUP), toAdvancedSettings(DEFAULT_ADVANCED), toWindOptions(DEFAULT_WIND))
    const point = findApproxPointAtDistance(sim.points, 30)

    expect(point.xM).toBeLessThanOrEqual(30)
  })
})