import { calculateHoldover, solveAngleForTarget } from "./aim"
import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import { findApproxPointAtDistance, simulateBallistics } from "./ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "./simulationAdapters"

export interface RangeCardRow {
  distance_m: number
  drop_m: number
  holdover_cm: number
  drift_cm: number
  solvedAngle_deg: number | null
}

export function generateRangeCardRows(
  distances_m: number[],
  targetHeight_cm: number,
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  withAngleSolver: boolean,
): RangeCardRow[] {
  const sim = simulateBallistics(toUserInputs(setup), toAdvancedSettings(advanced), toWindOptions(wind))

  return distances_m.map((distance_m) => {
    const holdover = calculateHoldover(setup, advanced, wind, distance_m, targetHeight_cm)
    const driftPoint = findApproxPointAtDistance(sim.points, distance_m)
    const solved = withAngleSolver
      ? solveAngleForTarget(setup, advanced, wind, distance_m, targetHeight_cm)
      : null

    return {
      distance_m,
      drop_m: holdover.yAtTarget_m,
      holdover_cm: holdover.holdover_cm,
      drift_cm: driftPoint.zM * 100,
      solvedAngle_deg: solved ? solved.angle_deg : null,
    }
  })
}
