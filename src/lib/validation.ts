import { EXCEL_LIMITS, EXTENDED_LIMITS } from "./constants"
import { mpsToFps } from "./units"
import type { AdvancedSettings, NumericRange, UserInputs } from "../types/ballistics"

export interface ValidationResult {
  errors: string[]
  excelWarnings: string[]
}

export function clampToRange(value: number, range: NumericRange): number {
  if (value < range.min) {
    return range.min
  }

  if (value > range.max) {
    return range.max
  }

  return value
}

export function validateInputs(inputs: UserInputs, settings: AdvancedSettings): ValidationResult {
  const errors: string[] = []
  const excelWarnings: string[] = []

  const speedFps = inputs.speedUnit === "fps" ? inputs.speedValue : mpsToFps(inputs.speedValue)

  if (speedFps < EXTENDED_LIMITS.speedFps.min || speedFps > EXTENDED_LIMITS.speedFps.max) {
    errors.push("Geschwindigkeit ausserhalb des zulaessigen Bereichs (20 bis 1200 fps).")
  }
  if (inputs.diameterMm < EXTENDED_LIMITS.diameterMm.min || inputs.diameterMm > EXTENDED_LIMITS.diameterMm.max) {
    errors.push("Pfeildurchmesser ausserhalb des zulaessigen Bereichs (2.0 bis 20.0 mm).")
  }
  if (inputs.weightGrain < EXTENDED_LIMITS.weightGrain.min) {
    errors.push("Pfeilgewicht ausserhalb des zulaessigen Bereichs (mindestens 50 grain).")
  }
  if (inputs.angleDeg < EXTENDED_LIMITS.angleDeg.min || inputs.angleDeg > EXTENDED_LIMITS.angleDeg.max) {
    errors.push("Abschusswinkel ausserhalb des zulaessigen Bereichs (0 bis 90 Grad).")
  }
  if (settings.dt < EXTENDED_LIMITS.dt.min || settings.dt > EXTENDED_LIMITS.dt.max) {
    errors.push("dt ausserhalb des zulaessigen Bereichs (0.0005 bis 0.01).")
  }
  if (
    settings.maxTimeSec < EXTENDED_LIMITS.maxTimeSec.min ||
    settings.maxTimeSec > EXTENDED_LIMITS.maxTimeSec.max
  ) {
    errors.push("maxTimeSec ausserhalb des zulaessigen Bereichs (5 bis 60).")
  }

  if (speedFps < EXCEL_LIMITS.speedFps.min || speedFps > EXCEL_LIMITS.speedFps.max) {
    excelWarnings.push("Geschwindigkeit ausserhalb Referenzbereich (50 bis 500 fps)")
  }
  if (inputs.diameterMm < EXCEL_LIMITS.diameterMm.min || inputs.diameterMm > EXCEL_LIMITS.diameterMm.max) {
    excelWarnings.push("Durchmesser ausserhalb Referenzbereich (4.0 bis 10.0 mm)")
  }
  if (inputs.angleDeg < EXCEL_LIMITS.angleDeg.min || inputs.angleDeg > EXCEL_LIMITS.angleDeg.max) {
    excelWarnings.push("Winkel ausserhalb Referenzbereich (0 bis 90 Grad)")
  }

  return {
    errors,
    excelWarnings,
  }
}
