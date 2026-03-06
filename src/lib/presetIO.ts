import type { Preset } from "./types"

export interface PresetExportFile {
  version: 1
  exportedAt: string
  presets: Preset[]
}

export function buildPresetExport(presets: Preset[]): PresetExportFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    presets,
  }
}

function hasValidPresetShape(input: unknown): input is Preset {
  if (!input || typeof input !== "object") {
    return false
  }

  const value = input as Preset
  return Boolean(
    value.id &&
      value.name &&
      value.setup &&
      Number.isFinite(value.setup.v_fps) &&
      Number.isFinite(value.setup.d_mm) &&
      Number.isFinite(value.setup.m_grain) &&
      Number.isFinite(value.setup.angle_deg),
  )
}

export function parsePresetImport(jsonText: string): Preset[] {
  const parsed = JSON.parse(jsonText) as { version?: number; presets?: unknown[] }

  if (parsed.version !== 1) {
    throw new Error("Unsupported import version")
  }

  if (!Array.isArray(parsed.presets)) {
    throw new Error("Invalid import format")
  }

  const invalidPreset = parsed.presets.find((preset) => !hasValidPresetShape(preset))
  if (invalidPreset) {
    throw new Error("Preset schema validation failed")
  }

  return parsed.presets as Preset[]
}