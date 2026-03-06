import { GRAIN_TO_KG_FACTOR } from "./units"

export type BowType = "Compound" | "Recurve" | "Langbogen"

export interface SetupEstimatorInput {
  bowType: BowType
  drawWeight_lbs: number
  drawLength_in: number
  iboSpeed_fps?: number | null
  efficiencyFactor: number
  arrowMass_grain: number
  extraMass_grain: number
}

export interface SetupEstimatorOutput {
  speed_fps: number
  speed_ms: number
  energy_J: number
  impulse_Ns: number
}

export const DEFAULT_EFFICIENCY_BY_BOW: Record<BowType, number> = {
  Compound: 0.85,
  Recurve: 0.7,
  Langbogen: 0.65,
}

export function estimateArrowSpeed(input: SetupEstimatorInput): SetupEstimatorOutput {
  const totalGrain = Math.max(1, input.arrowMass_grain + input.extraMass_grain)
  const mass_kg = totalGrain * GRAIN_TO_KG_FACTOR

  let speed_fps: number

  if (input.iboSpeed_fps && Number.isFinite(input.iboSpeed_fps)) {
    speed_fps =
      input.iboSpeed_fps -
      (input.arrowMass_grain - 350) * 0.5 +
      (input.drawWeight_lbs - 70) * 1.0 +
      (input.drawLength_in - 30) * 10.0

    speed_fps *= input.efficiencyFactor
  } else {
    const storedEnergy_J =
      input.drawWeight_lbs * 4.44822 * input.drawLength_in * 0.0254 * input.efficiencyFactor
    const speed_ms = Math.sqrt(Math.max(0, (2 * storedEnergy_J) / mass_kg))
    speed_fps = speed_ms / 0.3048
  }

  speed_fps = Math.max(20, Math.min(1200, speed_fps))

  const speed_ms = speed_fps * 0.3048
  const energy_J = 0.5 * mass_kg * speed_ms * speed_ms
  const impulse_Ns = mass_kg * speed_ms

  return {
    speed_fps,
    speed_ms,
    energy_J,
    impulse_Ns,
  }
}