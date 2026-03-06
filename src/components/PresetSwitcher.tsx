import type { BallisticsPreset, PresetId } from "../types/ballistics"

interface PresetSwitcherProps {
  presets: BallisticsPreset[]
  selectedPresetId: PresetId
  onSelect: (presetId: PresetId) => void
}

export function PresetSwitcher({ presets, selectedPresetId, onSelect }: PresetSwitcherProps) {
  return (
    <section className="card">
      <h2>Preset</h2>
      <label className="field">
        <span>Konfiguration</span>
        <select
          value={selectedPresetId}
          onChange={(event) => onSelect(event.target.value as PresetId)}
          aria-label="Preset Auswahl"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}