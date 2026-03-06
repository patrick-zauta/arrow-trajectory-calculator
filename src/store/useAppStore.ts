import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { defaultPositionForCategory } from "../lib/componentsBuilder"
import { buildJournalEntry, buildJournalRound, createDefaultFastTrainingSession } from "../lib/journal"
import { migratePersistedState } from "../lib/storageMigrations"
import type {
  AdvancedParams,
  AppState,
  ArrowBuild,
  ArrowComponentItem,
  ArrowSetup,
  ChartMetric,
  ChronoSession,
  ComponentTemplate,
  FastTrainingSession,
  HeightDisplayUnit,
  JournalEntry,
  Locale,
  Preset,
  RangeCardFormat,
  TerrainProfile,
  UiPreferences,
  WindParams,
} from "../lib/types"

const STORAGE_KEY = "arrow-app-state-v1"
const APP_SCHEMA_VERSION = 3

function cloneComponents(components: ArrowComponentItem[]): ArrowComponentItem[] {
  return components.map((component) => ({ ...component }))
}

function sumWeight(components: ArrowComponentItem[]): number {
  return components.reduce((sum, component) => sum + component.weight_grain, 0)
}

function buildArrowBuildId(name: string): string {
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return `${sanitized || "arrow-build"}-${Date.now()}`
}

export const DEFAULT_SETUP: ArrowSetup = {
  v_fps: 150,
  d_mm: 7.6,
  m_grain: 440,
  angle_deg: 30,
}

export const DEFAULT_ADVANCED: AdvancedParams = {
  cw: 2.1,
  rho: 1.2,
  g: 9.81,
  dt: 0.001,
  maxTimeSec: 30,
  k_override: null,
  simulationMode: "excel",
}

export const DEFAULT_WIND: WindParams = {
  enabled: false,
  windSpeed_mps: 0,
  windDirection_deg: 90,
}

export const DEFAULT_TERRAIN: TerrainProfile = {
  enabled: false,
  slope_deg: 0,
  offset_m: 0,
}

export const DEFAULT_COMPONENTS: ArrowComponentItem[] = [
  { id: "shaft", name: "Shaft", weight_grain: 300, category: "Shaft", position_mm: defaultPositionForCategory("Shaft"), length_mm: 760, material: "Carbon" },
  { id: "spitze", name: "Spitze", weight_grain: 100, category: "Spitze", position_mm: defaultPositionForCategory("Spitze"), length_mm: 30, material: "Stahl" },
  { id: "insert", name: "Insert", weight_grain: 25, category: "Insert", position_mm: defaultPositionForCategory("Insert"), length_mm: 25, material: "Alu" },
  { id: "nocke", name: "Nocke", weight_grain: 10, category: "Nocke", position_mm: defaultPositionForCategory("Nocke"), length_mm: 15, material: "Kunststoff" },
  { id: "vanes", name: "Vanes", weight_grain: 15, category: "Vanes", position_mm: defaultPositionForCategory("Vanes"), length_mm: 45, material: "Kunststoff" },
]

export const DEFAULT_COMPONENT_LIBRARY: ComponentTemplate[] = [
  { id: "tmpl-shaft-carbon", name: "Carbon Shaft", category: "Shaft", weight_grain: 300, defaultPosition_mm: defaultPositionForCategory("Shaft"), defaultLength_mm: 760, material: "Carbon" },
  { id: "tmpl-point-100", name: "100 gr Spitze", category: "Spitze", weight_grain: 100, defaultPosition_mm: defaultPositionForCategory("Spitze"), defaultLength_mm: 30, material: "Stahl" },
  { id: "tmpl-insert-25", name: "Insert 25 gr", category: "Insert", weight_grain: 25, defaultPosition_mm: defaultPositionForCategory("Insert"), defaultLength_mm: 25, material: "Alu" },
  { id: "tmpl-nocke", name: "Standard Nocke", category: "Nocke", weight_grain: 10, defaultPosition_mm: defaultPositionForCategory("Nocke"), defaultLength_mm: 15, material: "Kunststoff" },
]

const DEFAULT_UI_PREFERENCES: UiPreferences = {
  locale: "de",
  rangeCardFormat: "compact",
  chartMetric: "height",
  performanceMode: false,
}

export const SYSTEM_PRESETS: Preset[] = [
  {
    id: "standard-bsw",
    name: "Standard (Flugparabel_BSW)",
    setup: { v_fps: 150, d_mm: 7.6, m_grain: 440, angle_deg: 30 },
    advanced: DEFAULT_ADVANCED,
    wind: DEFAULT_WIND,
    isSystem: true,
  },
  {
    id: "pip-elb-50",
    name: "Pip_ELB_50_Holz 55-60 violett.lime",
    setup: { v_fps: 160, d_mm: 8.7, m_grain: 600, angle_deg: 45 },
    advanced: DEFAULT_ADVANCED,
    wind: DEFAULT_WIND,
    isSystem: true,
  },
]

export const SYSTEM_ARROW_BUILDS: ArrowBuild[] = [
  {
    id: "default-arrow",
    name: "Standardpfeil",
    components: cloneComponents(DEFAULT_COMPONENTS),
    arrowLength_mm: 760,
    notes: "Standardprofil",
    isSystem: true,
  },
]

export interface AppStore extends AppState {
  updateSetup: (patch: Partial<ArrowSetup>) => void
  updateAdvanced: (patch: Partial<AdvancedParams>) => void
  updateWind: (patch: Partial<WindParams>) => void
  updateTerrain: (patch: Partial<TerrainProfile>) => void
  setHeightDisplayUnit: (unit: HeightDisplayUnit) => void
  setLocale: (locale: Locale) => void
  setRangeCardFormat: (format: RangeCardFormat) => void
  setChartMetric: (metric: ChartMetric) => void
  setPerformanceMode: (enabled: boolean) => void
  setActivePresetId: (presetId: string) => void
  applyPreset: (presetId: string) => void
  saveCurrentAsPreset: (name: string) => Preset
  upsertPreset: (preset: Preset) => void
  removePreset: (presetId: string) => void
  replacePresets: (presets: Preset[]) => void
  setComponents: (components: ArrowComponentItem[]) => void
  setComponentLibrary: (templates: ComponentTemplate[]) => void
  addTemplateFromComponent: (component: ArrowComponentItem) => void
  updateComponentWeightAsSetup: (weightGrain: number) => void
  saveCurrentComponentsAsArrowBuild: (name: string) => ArrowBuild
  applyArrowBuild: (buildId: string) => void
  removeArrowBuild: (buildId: string) => void
  upsertArrowBuild: (build: ArrowBuild) => void
  addComponentFromTemplate: (templateId: string) => void
  updateArrowBuildMeta: (buildId: string, patch: Partial<ArrowBuild>) => void
  upsertChronoSession: (session: ChronoSession) => void
  removeChronoSession: (sessionId: string) => void
  addJournalEntry: (entry: JournalEntry) => void
  removeJournalEntry: (entryId: string) => void
  updateFastTraining: (patch: Partial<FastTrainingSession>) => void
  startFastTraining: () => void
  addFastTrainingRound: () => void
  removeLastFastTrainingRound: () => void
  saveFastTrainingToJournal: () => JournalEntry | null
  resetFastTraining: () => void
  resetToPresetDefaults: () => void
}

export function createDefaultState(): AppState {
  return {
    appSchemaVersion: APP_SCHEMA_VERSION,
    activeSetup: { ...DEFAULT_SETUP },
    advanced: { ...DEFAULT_ADVANCED },
    wind: { ...DEFAULT_WIND },
    terrain: { ...DEFAULT_TERRAIN },
    presets: [...SYSTEM_PRESETS],
    activePresetId: SYSTEM_PRESETS[0].id,
    components: cloneComponents(DEFAULT_COMPONENTS),
    componentLibrary: [...DEFAULT_COMPONENT_LIBRARY],
    arrowBuilds: [...SYSTEM_ARROW_BUILDS],
    activeArrowBuildId: SYSTEM_ARROW_BUILDS[0].id,
    chronoSessions: [],
    journalEntries: [],
    fastTraining: createDefaultFastTrainingSession(),
    heightDisplayUnit: "cm",
    uiPreferences: { ...DEFAULT_UI_PREFERENCES },
  }
}

function buildPresetId(name: string): string {
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return `${sanitized || "preset"}-${Date.now()}`
}

function mergeSystemPresets(presets: Preset[]): Preset[] {
  return [...SYSTEM_PRESETS, ...presets.filter((preset) => !preset.isSystem)]
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),
      updateSetup: (patch) => {
        set((state) => ({ activeSetup: { ...state.activeSetup, ...patch } }))
      },
      updateAdvanced: (patch) => {
        set((state) => ({ advanced: { ...state.advanced, ...patch } }))
      },
      updateWind: (patch) => {
        set((state) => ({ wind: { ...state.wind, ...patch } }))
      },
      updateTerrain: (patch) => {
        set((state) => ({ terrain: { ...state.terrain, ...patch } }))
      },
      setHeightDisplayUnit: (unit) => set({ heightDisplayUnit: unit }),
      setLocale: (locale) => set((state) => ({ uiPreferences: { ...state.uiPreferences, locale } })),
      setRangeCardFormat: (format) => set((state) => ({ uiPreferences: { ...state.uiPreferences, rangeCardFormat: format } })),
      setChartMetric: (metric) => set((state) => ({ uiPreferences: { ...state.uiPreferences, chartMetric: metric } })),
      setPerformanceMode: (enabled) => set((state) => ({ uiPreferences: { ...state.uiPreferences, performanceMode: enabled } })),
      setActivePresetId: (presetId) => set({ activePresetId: presetId }),
      applyPreset: (presetId) => {
        const preset = get().presets.find((entry) => entry.id === presetId)
        if (!preset) {
          return
        }
        set({
          activePresetId: presetId,
          activeSetup: { ...preset.setup },
          advanced: { ...preset.advanced },
          wind: { ...(preset.wind ?? DEFAULT_WIND) },
        })
      },
      saveCurrentAsPreset: (name) => {
        const state = get()
        const preset: Preset = {
          id: buildPresetId(name),
          name,
          setup: { ...state.activeSetup },
          advanced: { ...state.advanced },
          wind: { ...state.wind },
          isSystem: false,
        }
        set((current) => ({ presets: mergeSystemPresets([...current.presets.filter((entry) => entry.id !== preset.id), preset]), activePresetId: preset.id }))
        return preset
      },
      upsertPreset: (preset) => {
        set((state) => ({ presets: mergeSystemPresets([...state.presets.filter((entry) => entry.id !== preset.id), preset]) }))
      },
      removePreset: (presetId) => {
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== presetId || preset.isSystem),
          activePresetId: state.activePresetId === presetId ? SYSTEM_PRESETS[0].id : state.activePresetId,
        }))
      },
      replacePresets: (presets) => set({ presets: mergeSystemPresets(presets) }),
      setComponents: (components) => {
        set((state) => ({
          components,
          arrowBuilds: state.arrowBuilds.map((build) =>
            build.id === state.activeArrowBuildId ? { ...build, components: cloneComponents(components) } : build,
          ),
        }))
      },
      setComponentLibrary: (templates) => set({ componentLibrary: templates }),
      addTemplateFromComponent: (component) => {
        const template: ComponentTemplate = {
          id: `template-${Date.now()}`,
          name: component.name,
          category: component.category,
          weight_grain: component.weight_grain,
          defaultPosition_mm: component.position_mm,
          defaultLength_mm: component.length_mm,
          material: component.material,
        }
        set((state) => ({ componentLibrary: [...state.componentLibrary, template] }))
      },
      updateComponentWeightAsSetup: (weightGrain) => set((state) => ({ activeSetup: { ...state.activeSetup, m_grain: weightGrain } })),
      saveCurrentComponentsAsArrowBuild: (name) => {
        const state = get()
        const activeBuild = state.arrowBuilds.find((build) => build.id === state.activeArrowBuildId)
        const build: ArrowBuild = {
          id: buildArrowBuildId(name),
          name,
          components: cloneComponents(state.components),
          arrowLength_mm: activeBuild?.arrowLength_mm ?? 760,
          notes: activeBuild?.notes,
          isSystem: false,
        }
        set((current) => ({ arrowBuilds: [...current.arrowBuilds.filter((entry) => entry.id !== build.id), build], activeArrowBuildId: build.id }))
        return build
      },
      applyArrowBuild: (buildId) => {
        const build = get().arrowBuilds.find((entry) => entry.id === buildId)
        if (!build) {
          return
        }
        const components = cloneComponents(build.components)
        set((state) => ({
          activeArrowBuildId: buildId,
          components,
          activeSetup: { ...state.activeSetup, m_grain: sumWeight(components) },
        }))
      },
      removeArrowBuild: (buildId) => {
        set((state) => {
          const remaining = state.arrowBuilds.filter((build) => build.id !== buildId || build.isSystem)
          const nextActiveId = state.activeArrowBuildId === buildId ? (remaining[0]?.id ?? SYSTEM_ARROW_BUILDS[0].id) : state.activeArrowBuildId
          const nextActiveBuild = remaining.find((build) => build.id === nextActiveId) ?? SYSTEM_ARROW_BUILDS[0]
          const nextComponents = cloneComponents(nextActiveBuild.components)
          return {
            arrowBuilds: remaining,
            activeArrowBuildId: nextActiveId,
            components: nextComponents,
            activeSetup: { ...state.activeSetup, m_grain: sumWeight(nextComponents) },
          }
        })
      },
      upsertArrowBuild: (build) => set((state) => ({ arrowBuilds: [...state.arrowBuilds.filter((entry) => entry.id !== build.id), build] })),
      addComponentFromTemplate: (templateId) => {
        const template = get().componentLibrary.find((entry) => entry.id === templateId)
        if (!template) {
          return
        }
        const component: ArrowComponentItem = {
          id: `component-${Date.now()}`,
          name: template.name,
          category: template.category,
          weight_grain: template.weight_grain,
          position_mm: template.defaultPosition_mm,
          length_mm: template.defaultLength_mm,
          material: template.material,
        }
        const next = [...get().components, component]
        get().setComponents(next)
      },
      updateArrowBuildMeta: (buildId, patch) => {
        set((state) => ({
          arrowBuilds: state.arrowBuilds.map((build) => (build.id === buildId ? { ...build, ...patch } : build)),
        }))
      },
      upsertChronoSession: (session) => set((state) => ({ chronoSessions: [...state.chronoSessions.filter((entry) => entry.id !== session.id), session] })),
      removeChronoSession: (sessionId) => set((state) => ({ chronoSessions: state.chronoSessions.filter((entry) => entry.id !== sessionId) })),
      addJournalEntry: (entry) => set((state) => ({ journalEntries: [entry, ...state.journalEntries] })),
      removeJournalEntry: (entryId) => set((state) => ({ journalEntries: state.journalEntries.filter((entry) => entry.id !== entryId) })),
      updateFastTraining: (patch) => set((state) => ({ fastTraining: { ...state.fastTraining, ...patch } })),
      startFastTraining: () => set((state) => ({
        fastTraining: {
          ...state.fastTraining,
          active: true,
          startedAt: state.fastTraining.startedAt ?? new Date().toISOString(),
          rounds: state.fastTraining.active ? state.fastTraining.rounds : [],
        },
      })),
      addFastTrainingRound: () => set((state) => {
        const arrowsPerRound = Math.max(1, Math.round(state.fastTraining.arrowsPerRound || 8))
        return {
          fastTraining: {
            ...state.fastTraining,
            active: true,
            startedAt: state.fastTraining.startedAt ?? new Date().toISOString(),
            rounds: [...state.fastTraining.rounds, buildJournalRound(arrowsPerRound)],
          },
        }
      }),
      removeLastFastTrainingRound: () => set((state) => ({
        fastTraining: {
          ...state.fastTraining,
          rounds: state.fastTraining.rounds.slice(0, -1),
        },
      })),
      saveFastTrainingToJournal: () => {
        const state = get()
        if (state.fastTraining.rounds.length === 0) {
          return null
        }

        const activeArrowBuild = state.arrowBuilds.find((build) => build.id === state.activeArrowBuildId)
        const entry = buildJournalEntry(
          state.fastTraining.title,
          state.fastTraining.notes,
          state.fastTraining.weather,
          {
            setup: state.activeSetup,
            advanced: state.advanced,
            wind: state.wind,
            activeArrowBuildId: state.activeArrowBuildId,
            activeArrowBuildName: activeArrowBuild?.name ?? "Kein Pfeil",
          },
          {
            arrowsPerRound: Math.max(1, Math.round(state.fastTraining.arrowsPerRound || 8)),
            rounds: state.fastTraining.rounds,
          },
        )

        set((current) => ({
          journalEntries: [entry, ...current.journalEntries],
          fastTraining: createDefaultFastTrainingSession(),
        }))
        return entry
      },
      resetFastTraining: () => set({ fastTraining: createDefaultFastTrainingSession() }),
      resetToPresetDefaults: () => get().applyPreset(SYSTEM_PRESETS[0].id),
    }),
    {
      name: STORAGE_KEY,
      version: APP_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => migratePersistedState(persistedState, createDefaultState()),
      partialize: (state) => ({
        appSchemaVersion: state.appSchemaVersion,
        activeSetup: state.activeSetup,
        advanced: state.advanced,
        wind: state.wind,
        terrain: state.terrain,
        presets: state.presets,
        activePresetId: state.activePresetId,
        components: state.components,
        componentLibrary: state.componentLibrary,
        arrowBuilds: state.arrowBuilds,
        activeArrowBuildId: state.activeArrowBuildId,
        chronoSessions: state.chronoSessions,
        journalEntries: state.journalEntries,
        fastTraining: state.fastTraining,
        heightDisplayUnit: state.heightDisplayUnit,
        uiPreferences: state.uiPreferences,
      }),
    },
  ),
)

export const APP_STORAGE_KEY = STORAGE_KEY
export const APP_STATE_VERSION = APP_SCHEMA_VERSION
