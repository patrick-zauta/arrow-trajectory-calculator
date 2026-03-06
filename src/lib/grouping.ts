import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import { findApproxPointAtDistance, simulateBallistics } from "./ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "./simulationAdapters"

export interface GroupingTolerance {
  speed_fps: number
  angle_deg: number
  weight_grain: number
  wind_mps: number
}

export interface GroupingShot {
  x_m: number
  y_m: number
}

export interface GroupingResult {
  shots: GroupingShot[]
  spreadDiameter_cm: number
  meanOffsetY_cm: number
}

function createSeeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }
}

function sampleCentered(random: () => number, amplitude: number): number {
  return (random() * 2 - 1) * amplitude
}

export function simulateGrouping(
  setup: ArrowSetup,
  advanced: AdvancedParams,
  wind: WindParams,
  targetDistance_m: number,
  tolerance: GroupingTolerance,
  shotsCount = 25,
  seed = 42,
): GroupingResult {
  const random = createSeeded(seed)
  const shots: GroupingShot[] = []

  for (let index = 0; index < shotsCount; index += 1) {
    const variedSetup: ArrowSetup = {
      ...setup,
      v_fps: setup.v_fps + sampleCentered(random, tolerance.speed_fps),
      angle_deg: setup.angle_deg + sampleCentered(random, tolerance.angle_deg),
      m_grain: setup.m_grain + sampleCentered(random, tolerance.weight_grain),
    }
    const variedWind: WindParams = {
      ...wind,
      enabled: wind.enabled || tolerance.wind_mps > 0,
      windSpeed_mps: wind.windSpeed_mps + sampleCentered(random, tolerance.wind_mps),
    }

    const simulation = simulateBallistics(
      toUserInputs(variedSetup),
      toAdvancedSettings(advanced),
      toWindOptions(variedWind),
    )
    const point = findApproxPointAtDistance(simulation.points, targetDistance_m)
    shots.push({ x_m: point.zM, y_m: point.yM })
  }

  let maxDistance = 0
  for (let i = 0; i < shots.length; i += 1) {
    for (let j = i + 1; j < shots.length; j += 1) {
      const dx = shots[i].x_m - shots[j].x_m
      const dy = shots[i].y_m - shots[j].y_m
      maxDistance = Math.max(maxDistance, Math.sqrt(dx * dx + dy * dy))
    }
  }

  const meanOffsetY = shots.reduce((sum, shot) => sum + shot.y_m, 0) / Math.max(1, shots.length)

  return {
    shots,
    spreadDiameter_cm: maxDistance * 100,
    meanOffsetY_cm: meanOffsetY * 100,
  }
}
