import type { AdvancedSettings } from "../types/ballistics"

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  cw: 2.1,
  g: 9.81,
  rho: 1.2,
  dt: 0.001,
  maxTimeSec: 30,
}

export const EXTENDED_LIMITS = {
  speedFps: { min: 20, max: 1200 },
  diameterMm: { min: 2.0, max: 20.0 },
  weightGrain: { min: 50, max: 2000 },
  angleDeg: { min: 0, max: 90 },
  dt: { min: 0.0005, max: 0.01 },
  maxTimeSec: { min: 5, max: 60 },
} as const

export const EXCEL_LIMITS = {
  speedFps: { min: 50, max: 500 },
  diameterMm: { min: 4.0, max: 10.0 },
  weightGrain: { min: 100, max: 600 },
  angleDeg: { min: 0, max: 90 },
} as const