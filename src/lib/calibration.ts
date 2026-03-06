import { findApproxPointAtDistance, simulateBallistics } from "./ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "./simulationAdapters"
import type { AdvancedParams, ArrowSetup, WindParams } from "./types"

export type CalibrationTarget = "cw" | "k"

export interface CalibrationInput {
  setup: ArrowSetup
  advanced: AdvancedParams
  wind: WindParams
  measuredDistance_m: number
  measuredDrop_cm: number
  signMode: "auto-negative" | "manual"
  measuredDropSign: 1 | -1
  calibrationTarget: CalibrationTarget
  cwRange: { min: number; max: number }
  kRange: { min: number; max: number }
  maxIter: number
}

export interface CalibrationResult {
  previousValue: number
  calibratedValue: number
  errorBefore_m: number
  errorAfter_m: number
  targetY_m: number
  yBefore_m: number
  yAfter_m: number
  usedSignSwitch: boolean
}

function getError(
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance: number,
  yTarget: number,
): number {
  const sim = simulateBallistics(toUserInputs(setup), toAdvancedSettings(advanced), toWindOptions(wind))
  const point = findApproxPointAtDistance(sim.points, targetDistance)
  return point.yM - yTarget
}

export function calibrateFromMeasurement(input: CalibrationInput): CalibrationResult {
  const yTarget_m =
    input.signMode === "auto-negative"
      ? -Math.abs(input.measuredDrop_cm / 100)
      : (Math.abs(input.measuredDrop_cm) / 100) * input.measuredDropSign

  const baselineError = getError(input.setup, input.advanced, input.wind, input.measuredDistance_m, yTarget_m)

  let left = input.calibrationTarget === "cw" ? input.cwRange.min : input.kRange.min
  let right = input.calibrationTarget === "cw" ? input.cwRange.max : input.kRange.max

  const applyParam = (value: number): AdvancedParams => {
    if (input.calibrationTarget === "cw") {
      return { ...input.advanced, cw: value, k_override: null }
    }

    return { ...input.advanced, k_override: value }
  }

  let errorLeft = getError(
    input.setup,
    applyParam(left),
    input.wind,
    input.measuredDistance_m,
    yTarget_m,
  )
  let errorRight = getError(
    input.setup,
    applyParam(right),
    input.wind,
    input.measuredDistance_m,
    yTarget_m,
  )

  let bestValue = input.calibrationTarget === "cw" ? input.advanced.cw : input.advanced.k_override ?? 0.005
  let bestError = baselineError

  const signSwitch = Math.sign(errorLeft) !== Math.sign(errorRight)

  for (let iter = 0; iter < input.maxIter; iter += 1) {
    const mid = (left + right) / 2
    const errMid = getError(
      input.setup,
      applyParam(mid),
      input.wind,
      input.measuredDistance_m,
      yTarget_m,
    )

    if (Math.abs(errMid) < Math.abs(bestError)) {
      bestError = errMid
      bestValue = mid
    }

    if (Math.abs(errMid) < 0.001) {
      break
    }

    if (!signSwitch) {
      if (iter % 2 === 0) {
        left = Math.max(left, mid - (right - left) * 0.25)
      } else {
        right = Math.min(right, mid + (right - left) * 0.25)
      }
      continue
    }

    if (Math.sign(errorLeft) === Math.sign(errMid)) {
      left = mid
      errorLeft = errMid
    } else {
      right = mid
      errorRight = errMid
    }
  }

  return {
    previousValue: input.calibrationTarget === "cw" ? input.advanced.cw : input.advanced.k_override ?? 0,
    calibratedValue: bestValue,
    errorBefore_m: baselineError,
    errorAfter_m: bestError,
    targetY_m: yTarget_m,
    yBefore_m: yTarget_m + baselineError,
    yAfter_m: yTarget_m + bestError,
    usedSignSwitch: signSwitch,
  }
}
