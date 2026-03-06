import type { AdvancedParams, ArrowSetup, WindParams } from "./types"
import type { AdvancedSettings, UserInputs, WindOptions } from "../types/ballistics"

export function toUserInputs(setup: ArrowSetup): UserInputs {
  return {
    speedValue: setup.v_fps,
    speedUnit: "fps",
    diameterMm: setup.d_mm,
    weightGrain: setup.m_grain,
    angleDeg: setup.angle_deg,
  }
}

export function toAdvancedSettings(advanced: AdvancedParams): AdvancedSettings {
  return {
    cw: advanced.cw,
    rho: advanced.rho,
    g: advanced.g,
    dt: advanced.dt,
    maxTimeSec: advanced.maxTimeSec,
    kOverride: advanced.k_override,
    simulationMode: advanced.simulationMode ?? "excel",
  }
}

export function toWindOptions(wind: WindParams): WindOptions {
  return {
    enabled: wind.enabled,
    windSpeedMps: wind.windSpeed_mps,
    windDirectionDeg: wind.windDirection_deg,
  }
}