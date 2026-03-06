import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import { findApproxPointAtDistance, simulateBallistics } from "./ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "./simulationAdapters"

export interface SensitivityRow {
  label: string
  delta: string
  nullDistanceDelta_m: number
  heightAtDistanceDelta_m: number
  driftDelta_m: number
}

export function analyzeSensitivity(
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
): SensitivityRow[] {
  const base = simulateBallistics(toUserInputs(setup), toAdvancedSettings(advanced), toWindOptions(wind))
  const basePoint = findApproxPointAtDistance(base.points, targetDistance_m)

  const variants: Array<{ label: string; delta: string; setup: ArrowSetup; wind: WindParams }> = [
    { label: "Geschwindigkeit", delta: "+5 fps", setup: { ...setup, v_fps: setup.v_fps + 5 }, wind },
    { label: "Gewicht", delta: "+25 grain", setup: { ...setup, m_grain: setup.m_grain + 25 }, wind },
    { label: "Winkel", delta: "+1 deg", setup: { ...setup, angle_deg: setup.angle_deg + 1 }, wind },
    { label: "Wind", delta: "+1 m/s", setup, wind: { ...wind, enabled: true, windSpeed_mps: wind.windSpeed_mps + 1 } },
  ]

  return variants.map((variant) => {
    const simulation = simulateBallistics(
      toUserInputs(variant.setup),
      toAdvancedSettings(advanced),
      toWindOptions(variant.wind),
    )
    const point = findApproxPointAtDistance(simulation.points, targetDistance_m)

    return {
      label: variant.label,
      delta: variant.delta,
      nullDistanceDelta_m: simulation.nullDistanceM - base.nullDistanceM,
      heightAtDistanceDelta_m: point.yM - basePoint.yM,
      driftDelta_m: point.zM - basePoint.zM,
    }
  })
}
