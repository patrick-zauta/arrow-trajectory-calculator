import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import { findApproxPointAtDistance, simulateBallistics } from "./ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "./simulationAdapters"

export interface ZeroingResult {
  targetDistance_m: number
  targetHeight_cm: number
  angle_deg: number
  error_m: number
}

export function solveZeroDistance(
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
  targetHeight_cm = 0,
): ZeroingResult {
  let low = 0
  let high = 90
  let bestAngle = setup.angle_deg
  let bestError = Number.POSITIVE_INFINITY
  const targetY = targetHeight_cm / 100

  for (let iteration = 0; iteration < 40; iteration += 1) {
    const mid = (low + high) / 2
    const simulation = simulateBallistics(
      toUserInputs({ ...setup, angle_deg: mid }),
      toAdvancedSettings(advanced),
      toWindOptions(wind),
    )
    const point = findApproxPointAtDistance(simulation.points, targetDistance_m)
    const error = point.yM - targetY

    if (Math.abs(error) < Math.abs(bestError)) {
      bestError = error
      bestAngle = mid
    }

    if (Math.abs(error) < 0.005) {
      break
    }

    if (error > 0) {
      high = mid
    } else {
      low = mid
    }
  }

  return {
    targetDistance_m,
    targetHeight_cm,
    angle_deg: bestAngle,
    error_m: bestError,
  }
}
