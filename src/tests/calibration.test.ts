import { describe, expect, it } from "vitest"
import { calibrateFromMeasurement } from "../lib/calibration"
import { findApproxPointAtDistance, simulateBallistics } from "../lib/ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import { DEFAULT_ADVANCED, DEFAULT_SETUP, DEFAULT_WIND } from "../store/useAppStore"

describe("calibration", () => {
  it("reduces error for synthetic measurement", () => {
    const trueAdvanced = { ...DEFAULT_ADVANCED, cw: 2.8 }
    const sim = simulateBallistics(toUserInputs(DEFAULT_SETUP), toAdvancedSettings(trueAdvanced), toWindOptions(DEFAULT_WIND))
    const point = findApproxPointAtDistance(sim.points, 30)

    const measuredDrop_cm = Math.abs(point.yM) * 100

    const result = calibrateFromMeasurement({
      setup: DEFAULT_SETUP,
      advanced: DEFAULT_ADVANCED,
      wind: DEFAULT_WIND,
      measuredDistance_m: 30,
      measuredDrop_cm,
      signMode: "auto-negative",
      measuredDropSign: -1,
      calibrationTarget: "cw",
      cwRange: { min: 0.5, max: 5 },
      kRange: { min: 0.0001, max: 0.05 },
      maxIter: 50,
    })

    expect(Math.abs(result.errorAfter_m)).toBeLessThanOrEqual(Math.abs(result.errorBefore_m))
  })
})