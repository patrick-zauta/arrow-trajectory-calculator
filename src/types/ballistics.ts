export type SpeedUnit = "fps" | "mps"

export type AngleInputMode = "fine" | "direct"

export type CurveRangeMode = "apex" | "zero"

export type PresetId = "standard-bsw" | "pip-elb-50"

export interface UserInputs {
  speedValue: number
  speedUnit: SpeedUnit
  diameterMm: number
  weightGrain: number
  angleDeg: number
}

export interface AdvancedSettings {
  cw: number
  g: number
  rho: number
  dt: number
  maxTimeSec: number
}

export interface DerivedValues {
  speedMs: number
  massKg: number
  areaM2: number
  dragFactorK: number
}

export interface TrajectoryPoint {
  timeSec: number
  xM: number
  yM: number
  vxMs: number
  vyMs: number
}

export interface BallisticsResult {
  points: TrajectoryPoint[]
  apexIndex: number
  landIndex: number
  apexDistanceM: number
  apexHeightM: number
  nullDistanceM: number
  derived: DerivedValues
}

export interface SupportPoint {
  targetDistanceM: number
  effectiveDistanceM: number
  heightCm: number
}

export interface NumericRange {
  min: number
  max: number
}

export interface BallisticsPreset {
  id: PresetId
  label: string
  speedFps: number
  diameterMm: number
  weightGrain: number
  angleDeg: number
}