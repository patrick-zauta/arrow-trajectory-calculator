import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  AdvancedParams,
  AppState,
  ArrowBuild,
  ArrowComponentItem,
  ArrowSetup,
  HeightDisplayUnit,
  Preset,
  WindParams,
} from "../lib/types"

const STORAGE_KEY = "arrow-app-state-v1"

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

export const DEFAULT_COMPONENTS: ArrowComponentItem[] = [
  { id: "shaft", name: "Shaft", weight_grain: 300, category: "Shaft" },
  { id: "spitze", name: "Spitze", weight_grain: 100, category: "Spitze" },
  { id: "insert", name: "Insert", weight_grain: 25, category: "Insert" },
  { id: "nocke", name: "Nocke", weight_grain: 10, category: "Nocke" },
  { id: "vanes", name: "Vanes", weight_grain: 15, category: "Vanes" },
]

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
    isSystem: true,
  },
]

export interface AppStore extends AppState {
  updateSetup: (patch: Partial<ArrowSetup>) => void
  updateAdvanced: (patch: Partial<AdvancedParams>) => void
  updateWind: (patch: Partial<WindParams>) => void
  setHeightDisplayUnit: (unit: HeightDisplayUnit) => void
  setActivePresetId: (presetId: string) => void
  applyPreset: (presetId: string) => void
  saveCurrentAsPreset: (name: string) => Preset
  upsertPreset: (preset: Preset) => void
  removePreset: (presetId: string) => void
  replacePresets: (presets: Preset[]) => void
  setComponents: (components: ArrowComponentItem[]) => void
  updateComponentWeightAsSetup: (weightGrain: number) => void
  saveCurrentComponentsAsArrowBuild: (name: string) => ArrowBuild
  applyArrowBuild: (buildId: string) => void
  removeArrowBuild: (buildId: string) => void
  upsertArrowBuild: (build: ArrowBuild) => void
  resetToPresetDefaults: () => void
}

export function createDefaultState(): AppState {
  return {
    activeSetup: { ...DEFAULT_SETUP },
    advanced: { ...DEFAULT_ADVANCED },
    wind: { ...DEFAULT_WIND },
    presets: [...SYSTEM_PRESETS],
    activePresetId: SYSTEM_PRESETS[0].id,
    components: cloneComponents(DEFAULT_COMPONENTS),
    arrowBuilds: [...SYSTEM_ARROW_BUILDS],
    activeArrowBuildId: SYSTEM_ARROW_BUILDS[0].id,
    heightDisplayUnit: "cm",
  }
}

function buildPresetId(name: string): string {
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return `${sanitized || "preset"}-${Date.now()}`
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...createDefaultState(),

      updateSetup: (patch) => {
        set((state) => ({
          activeSetup: {
            ...state.activeSetup,
            ...patch,
          },
        }))
      },

      updateAdvanced: (patch) => {
        set((state) => ({
          advanced: {
            ...state.advanced,
            ...patch,
          },
        }))
      },

      updateWind: (patch) => {
        set((state) => ({
          wind: {
            ...state.wind,
            ...patch,
          },
        }))
      },

      setHeightDisplayUnit: (unit) => {
        set({ heightDisplayUnit: unit })
      },

      setActivePresetId: (presetId) => {
        set({ activePresetId: presetId })
      },

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

        set((current) => ({
          presets: [...current.presets.filter((entry) => entry.id !== preset.id), preset],
          activePresetId: preset.id,
        }))

        return preset
      },

      upsertPreset: (preset) => {
        set((state) => ({
          presets: [...state.presets.filter((entry) => entry.id !== preset.id), preset],
        }))
      },

      removePreset: (presetId) => {
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== presetId || preset.isSystem),
          activePresetId: state.activePresetId === presetId ? SYSTEM_PRESETS[0].id : state.activePresetId,
        }))
      },

      replacePresets: (presets) => {
        set((state) => ({
          presets: [...SYSTEM_PRESETS, ...presets.filter((preset) => !preset.isSystem)],
          activePresetId: state.activePresetId,
        }))
      },

      setComponents: (components) => {
        set((state) => ({
          components,
          arrowBuilds: state.arrowBuilds.map((build) =>
            build.id === state.activeArrowBuildId ? { ...build, components: cloneComponents(components) } : build,
          ),
        }))
      },

      updateComponentWeightAsSetup: (weightGrain) => {
        set((state) => ({
          activeSetup: {
            ...state.activeSetup,
            m_grain: weightGrain,
          },
        }))
      },

      saveCurrentComponentsAsArrowBuild: (name) => {
        const state = get()
        const build: ArrowBuild = {
          id: buildArrowBuildId(name),
          name,
          components: cloneComponents(state.components),
          isSystem: false,
        }

        set((current) => ({
          arrowBuilds: [...current.arrowBuilds.filter((entry) => entry.id !== build.id), build],
          activeArrowBuildId: build.id,
        }))

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
          activeSetup: {
            ...state.activeSetup,
            m_grain: sumWeight(components),
          },
        }))
      },

      removeArrowBuild: (buildId) => {
        set((state) => {
          const remaining = state.arrowBuilds.filter((build) => build.id !== buildId || build.isSystem)
          const nextActiveId =
            state.activeArrowBuildId === buildId ? (remaining[0]?.id ?? SYSTEM_ARROW_BUILDS[0].id) : state.activeArrowBuildId
          const nextActiveBuild =
            remaining.find((build) => build.id === nextActiveId) ?? SYSTEM_ARROW_BUILDS[0]
          const nextComponents = cloneComponents(nextActiveBuild.components)

          return {
            arrowBuilds: remaining,
            activeArrowBuildId: nextActiveId,
            components: nextComponents,
            activeSetup: {
              ...state.activeSetup,
              m_grain: sumWeight(nextComponents),
            },
          }
        })
      },

      upsertArrowBuild: (build) => {
        set((state) => ({
          arrowBuilds: [...state.arrowBuilds.filter((entry) => entry.id !== build.id), build],
        }))
      },

      resetToPresetDefaults: () => {
        get().applyPreset(SYSTEM_PRESETS[0].id)
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSetup: state.activeSetup,
        advanced: state.advanced,
        wind: state.wind,
        presets: state.presets,
        activePresetId: state.activePresetId,
        components: state.components,
        arrowBuilds: state.arrowBuilds,
        activeArrowBuildId: state.activeArrowBuildId,
        heightDisplayUnit: state.heightDisplayUnit,
      }),
    },
  ),
)

export const APP_STORAGE_KEY = STORAGE_KEY
