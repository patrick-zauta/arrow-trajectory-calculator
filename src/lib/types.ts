export type SpeedUnit = "fps" | "mps"
export type HeightDisplayUnit = "cm" | "m"

export interface ArrowSetup {
  v_fps: number
  d_mm: number
  m_grain: number
  angle_deg: number
}

export interface AdvancedParams {
  cw: number
  rho: number
  g: number
  dt: number
  maxTimeSec: number
  k_override?: number | null
  simulationMode?: "excel" | "physics"
}

export interface WindParams {
  enabled: boolean
  windSpeed_mps: number
  windDirection_deg: number
}

export interface Preset {
  id: string
  name: string
  setup: ArrowSetup
  advanced: AdvancedParams
  wind?: WindParams
  isSystem?: boolean
}

export type ComponentCategory =
  | "Shaft"
  | "Spitze"
  | "Insert"
  | "Nocke"
  | "Vanes"
  | "Wrap"
  | "Sonstiges"

export interface ArrowComponentItem {
  id: string
  name: string
  weight_grain: number
  category: ComponentCategory
}

export interface ArrowBuild {
  id: string
  name: string
  components: ArrowComponentItem[]
  isSystem?: boolean
}

export interface AppState {
  activeSetup: ArrowSetup
  advanced: AdvancedParams
  wind: WindParams
  presets: Preset[]
  activePresetId: string
  components: ArrowComponentItem[]
  arrowBuilds: ArrowBuild[]
  activeArrowBuildId: string
  heightDisplayUnit: HeightDisplayUnit
}
