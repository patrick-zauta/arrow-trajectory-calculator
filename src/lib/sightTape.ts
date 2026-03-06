import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import { calculateHoldover, solveAngleForTarget } from "./aim"

export interface SightTapeRow {
  distance_m: number
  holdover_cm: number
  solvedAngle_deg: number
  mark: string
}

export function generateSightTape(
  distances_m: number[],
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
): SightTapeRow[] {
  return distances_m.map((distance_m, index) => {
    const holdover = calculateHoldover(setup, advanced, wind, distance_m, 0)
    const solved = solveAngleForTarget(setup, advanced, wind, distance_m, 0)

    return {
      distance_m,
      holdover_cm: holdover.holdover_cm,
      solvedAngle_deg: solved.angle_deg,
      mark: `M${index + 1}`,
    }
  })
}
