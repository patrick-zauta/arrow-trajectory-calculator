export type SpeedUnit = "fps" | "mps"
export type HeightDisplayUnit = "cm" | "m"
export type Locale = "de" | "en"
export type RangeCardFormat = "compact" | "jagd" | "turnier"
export type ChartMetric = "height" | "speed" | "energy" | "impulse" | "drift"

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

export interface TerrainProfile {
  enabled: boolean
  slope_deg: number
  offset_m: number
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
  position_mm: number
  length_mm?: number
  material?: string
}

export interface ArrowBuild {
  id: string
  name: string
  components: ArrowComponentItem[]
  arrowLength_mm: number
  notes?: string
  isSystem?: boolean
}

export interface ComponentTemplate {
  id: string
  name: string
  category: ComponentCategory
  weight_grain: number
  defaultPosition_mm: number
  defaultLength_mm?: number
  material?: string
}

export interface ChronoEntry {
  id: string
  label: string
  speed_fps: number
}

export interface ChronoSession {
  id: string
  name: string
  entries: ChronoEntry[]
  createdAt: string
}

export interface SetupSnapshot {
  setup: ArrowSetup
  advanced: AdvancedParams
  wind: WindParams
  activeArrowBuildId: string
  activeArrowBuildName: string
}

export interface JournalRound {
  id: string
  createdAt: string
  arrowCount: number
  hits?: number
  points?: number
  note?: string
}

export interface JournalEntry {
  id: string
  title: string
  createdAt: string
  notes: string
  weather: string
  arrowsPerRound: number
  roundCount: number
  totalArrows: number
  rounds: JournalRound[]
  snapshot: SetupSnapshot
}

export interface FastTrainingSession {
  active: boolean
  title: string
  weather: string
  notes: string
  arrowsPerRound: number
  rounds: JournalRound[]
  startedAt: string | null
}

export interface UiPreferences {
  locale: Locale
  rangeCardFormat: RangeCardFormat
  chartMetric: ChartMetric
  performanceMode: boolean
}

export interface AppState {
  appSchemaVersion: number
  activeSetup: ArrowSetup
  advanced: AdvancedParams
  wind: WindParams
  terrain: TerrainProfile
  presets: Preset[]
  activePresetId: string
  components: ArrowComponentItem[]
  componentLibrary: ComponentTemplate[]
  arrowBuilds: ArrowBuild[]
  activeArrowBuildId: string
  chronoSessions: ChronoSession[]
  journalEntries: JournalEntry[]
  fastTraining: FastTrainingSession
  heightDisplayUnit: HeightDisplayUnit
  uiPreferences: UiPreferences
}
