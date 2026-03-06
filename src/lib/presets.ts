import type { BallisticsPreset, PresetId, SpeedUnit } from "../types/ballistics"
import { fpsToMps } from "./units"

export const PRESETS: BallisticsPreset[] = [
  {
    id: "standard-bsw",
    label: "Standard (Excel Flugparabel_BSW)",
    speedFps: 150,
    diameterMm: 7.6,
    weightGrain: 440,
    angleDeg: 30,
  },
  {
    id: "pip-elb-50",
    label: "Pip_ELB_50_Holz 55-60 violett.lime",
    speedFps: 160,
    diameterMm: 8.7,
    weightGrain: 600,
    angleDeg: 45,
  },
]

export const DEFAULT_PRESET_ID: PresetId = "standard-bsw"

export function getPresetById(id: PresetId): BallisticsPreset {
  const preset = PRESETS.find((entry) => entry.id === id)
  return preset ?? PRESETS[0]
}

export function getPresetSpeedForUnit(speedFps: number, unit: SpeedUnit): number {
  if (unit === "fps") {
    return speedFps
  }

  return fpsToMps(speedFps)
}