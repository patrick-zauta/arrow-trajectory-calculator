import { describe, expect, it } from "vitest"
import { DEFAULT_ADVANCED, DEFAULT_SETUP, DEFAULT_WIND } from "../store/useAppStore"
import { solveZeroDistance } from "../lib/zeroing"
import { simulateGrouping } from "../lib/grouping"
import { simulateBallistics, findApproxPointAtDistance } from "../lib/ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"

describe("zeroing and grouping", () => {
  it("solves an angle close to target", () => {
    const result = solveZeroDistance(DEFAULT_SETUP, DEFAULT_ADVANCED, DEFAULT_WIND, 30, 0)
    const simulation = simulateBallistics(
      toUserInputs({ ...DEFAULT_SETUP, angle_deg: result.angle_deg }),
      toAdvancedSettings(DEFAULT_ADVANCED),
      toWindOptions(DEFAULT_WIND),
    )
    const point = findApproxPointAtDistance(simulation.points, 30)

    expect(Math.abs(point.yM)).toBeLessThan(0.1)
  })

  it("simulates deterministic grouping", () => {
    const result = simulateGrouping(DEFAULT_SETUP, DEFAULT_ADVANCED, DEFAULT_WIND, 30, {
      speed_fps: 3,
      angle_deg: 0.3,
      weight_grain: 8,
      wind_mps: 0,
    }, 12, 123)

    expect(result.shots).toHaveLength(12)
    expect(result.spreadDiameter_cm).toBeGreaterThanOrEqual(0)
  })
})
