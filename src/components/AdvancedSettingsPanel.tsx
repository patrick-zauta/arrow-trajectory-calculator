import type { AdvancedSettings } from "../types/ballistics"

interface AdvancedSettingsProps {
  settings: AdvancedSettings
  onSettingsChange: (nextSettings: AdvancedSettings) => void
}

export function AdvancedSettingsPanel({ settings, onSettingsChange }: AdvancedSettingsProps) {
  const update = <K extends keyof AdvancedSettings>(key: K, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  return (
    <details className="card">
      <summary>Advanced Settings</summary>

      <div className="advanced-grid">
        <label className="field">
          <span>Cw</span>
          <input
            type="number"
            value={settings.cw}
            step={0.01}
            min={0.1}
            max={10}
            onChange={(event) => update("cw", Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>g</span>
          <input
            type="number"
            value={settings.g}
            step={0.01}
            min={1}
            max={20}
            onChange={(event) => update("g", Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>rho</span>
          <input
            type="number"
            value={settings.rho}
            step={0.01}
            min={0.1}
            max={3}
            onChange={(event) => update("rho", Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>dt</span>
          <input
            type="number"
            value={settings.dt}
            step={0.0001}
            min={0.0005}
            max={0.01}
            onChange={(event) => update("dt", Number(event.target.value))}
          />
        </label>

        <label className="field">
          <span>maxTimeSec</span>
          <input
            type="number"
            value={settings.maxTimeSec}
            step={1}
            min={5}
            max={60}
            onChange={(event) => update("maxTimeSec", Number(event.target.value))}
          />
        </label>
      </div>
    </details>
  )
}