import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  AdvancedParams,
  AppState,
  ArrowComponentItem,
  ArrowSetup,
  Preset,
  WindParams,
} from "../lib/types"

const STORAGE_KEY = "arrow-app-state-v1"

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

export interface AppStore extends AppState {
  updateSetup: (patch: Partial<ArrowSetup>) => void
  updateAdvanced: (patch: Partial<AdvancedParams>) => void
  updateWind: (patch: Partial<WindParams>) => void
  setActivePresetId: (presetId: string) => void
  applyPreset: (presetId: string) => void
  saveCurrentAsPreset: (name: string) => Preset
  upsertPreset: (preset: Preset) => void
  removePreset: (presetId: string) => void
  replacePresets: (presets: Preset[]) => void
  setComponents: (components: ArrowComponentItem[]) => void
  updateComponentWeightAsSetup: (weightGrain: number) => void
  resetToPresetDefaults: () => void
}

export function createDefaultState(): AppState {
  return {
    activeSetup: { ...DEFAULT_SETUP },
    advanced: { ...DEFAULT_ADVANCED },
    wind: { ...DEFAULT_WIND },
    presets: [...SYSTEM_PRESETS],
    activePresetId: SYSTEM_PRESETS[0].id,
    components: [...DEFAULT_COMPONENTS],
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
        set({ components })
      },

      updateComponentWeightAsSetup: (weightGrain) => {
        set((state) => ({
          activeSetup: {
            ...state.activeSetup,
            m_grain: weightGrain,
          },
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
      }),
    },
  ),
)

export const APP_STORAGE_KEY = STORAGE_KEY
