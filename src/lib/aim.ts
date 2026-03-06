import { findApproxPointAtDistance, simulateBallistics } from "./ballistics"
import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "./simulationAdapters"

export type AimMode = "holdover" | "solve-angle"

export interface AimResult {
  targetDistance_m: number
  targetHeight_cm: number
  yAtTarget_m: number
  holdover_cm: number
}

export interface AngleSolverResult {
  angle_deg: number
  error_m: number
  reachedTolerance: boolean
  reachableInRange: boolean
}

export interface PinRecommendation {
  pinDistance_m: number
  pinHoldover_cm: number
  residualHoldover_cm: number
}

export function calculateHoldover(
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
  targetHeight_cm: number,
): AimResult {
  const simulation = simulateBallistics(toUserInputs(setup), toAdvancedSettings(advanced), toWindOptions(wind))
  const point = findApproxPointAtDistance(simulation.points, targetDistance_m)
  const yTarget_m = targetHeight_cm / 100
  const holdover_m = yTarget_m - point.yM

  return {
    targetDistance_m,
    targetHeight_cm,
    yAtTarget_m: point.yM,
    holdover_cm: holdover_m * 100,
  }
}

function errorAtAngle(
  angle_deg: number,
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
  yTarget_m: number,
): number {
  const sim = simulateBallistics(
    toUserInputs({ ...setup, angle_deg }),
    toAdvancedSettings(advanced),
    toWindOptions(wind),
  )
  const point = findApproxPointAtDistance(sim.points, targetDistance_m)
  return point.yM - yTarget_m
}

export function solveAngleForTarget(
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
  targetHeight_cm: number,
  maxIter = 40,
): AngleSolverResult {
  const yTarget_m = targetHeight_cm / 100

  const sampled: Array<{ angle: number; error: number }> = []
  for (let angle = 0; angle <= 90; angle += 1) {
    sampled.push({
      angle,
      error: errorAtAngle(angle, setup, advanced, wind, targetDistance_m, yTarget_m),
    })
  }

  const bestSample = sampled.reduce((best, current) =>
    Math.abs(current.error) < Math.abs(best.error) ? current : best,
  )

  let bestAngle = bestSample.angle
  let bestError = bestSample.error

  let bracket: { left: number; right: number; errLeft: number; errRight: number } | null = null

  for (let index = 0; index < sampled.length - 1; index += 1) {
    const left = sampled[index]
    const right = sampled[index + 1]
    if (left.error === 0 || right.error === 0 || Math.sign(left.error) !== Math.sign(right.error)) {
      bracket = {
        left: left.angle,
        right: right.angle,
        errLeft: left.error,
        errRight: right.error,
      }
      break
    }
  }

  if (!bracket) {
    return {
      angle_deg: bestAngle,
      error_m: bestError,
      reachedTolerance: Math.abs(bestError) < 0.005,
      reachableInRange: false,
    }
  }

  let left = bracket.left
  let right = bracket.right
  let errLeft = bracket.errLeft
  let errRight = bracket.errRight

  for (let iter = 0; iter < maxIter; iter += 1) {
    const mid = (left + right) / 2
    const errMid = errorAtAngle(mid, setup, advanced, wind, targetDistance_m, yTarget_m)

    if (Math.abs(errMid) < Math.abs(bestError)) {
      bestError = errMid
      bestAngle = mid
    }

    if (Math.abs(errMid) < 0.005) {
      return {
        angle_deg: mid,
        error_m: errMid,
        reachedTolerance: true,
        reachableInRange: true,
      }
    }

    if (Math.sign(errLeft) === Math.sign(errMid)) {
      left = mid
      errLeft = errMid
    } else {
      right = mid
      errRight = errMid
    }
  }

  return {
    angle_deg: bestAngle,
    error_m: bestError,
    reachedTolerance: Math.abs(bestError) < 0.005,
    reachableInRange: true,
  }
}

export function recommendPin(
  pinDistances_m: number[],
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
  targetHeight_cm: number,
): PinRecommendation | null {
  if (pinDistances_m.length === 0) {
    return null
  }

  const target = calculateHoldover(setup, advanced, wind, targetDistance_m, targetHeight_cm)

  let best: PinRecommendation | null = null

  pinDistances_m.forEach((pinDistance_m) => {
    const pin = calculateHoldover(setup, advanced, wind, pinDistance_m, targetHeight_cm)
    const residualHoldover_cm = target.holdover_cm - pin.holdover_cm

    const candidate: PinRecommendation = {
      pinDistance_m,
      pinHoldover_cm: pin.holdover_cm,
      residualHoldover_cm,
    }

    if (!best || Math.abs(candidate.residualHoldover_cm) < Math.abs(best.residualHoldover_cm)) {
      best = candidate
    }
  })

  return best
}
