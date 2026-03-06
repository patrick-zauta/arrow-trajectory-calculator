import type { AdvancedSettings } from "../types/ballistics"
import { DraftNumberInput } from "./DraftNumberInput"
import { InfoHint } from "./InfoHint"

interface AdvancedSettingsProps {
  settings: AdvancedSettings
  onSettingsChange: (nextSettings: AdvancedSettings) => void
}

export function AdvancedSettingsPanel({ settings, onSettingsChange }: AdvancedSettingsProps) {
  const update = <K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <details className="card">
      <summary>Advanced Settings <InfoHint text="Hier werden Widerstand, Dichte, Integrationsschritt und Simulationsmodus angepasst. Diese Werte wirken global in allen Rechnern." /></summary>

      <div className="advanced-grid">
        <label className="field">
          <span>Simulation Mode <InfoHint text="Referenzmodus nutzt das bestehende Modell mit abs in der vertikalen Drag-Komponente. Physik sauber nutzt den signierten Vektoransatz." /></span>
          <select value={settings.simulationMode ?? "excel"} onChange={(event) => update("simulationMode", event.target.value as AdvancedSettings["simulationMode"])}>
            <option value="excel">Excel kompatibel</option>
            <option value="physics">Physik sauber</option>
          </select>
          <small>Excel: asy mit abs. Physik: Drag ohne abs entlang Geschwindigkeitsvektor.</small>
        </label>

        <label className="field">
          <span>Cw <InfoHint text="Der Widerstandsbeiwert skaliert die Bremswirkung durch den Luftwiderstand." /></span>
          <DraftNumberInput value={settings.cw} onCommit={(next) => update("cw", next ?? settings.cw)} step={0.01} min={0.1} max={10} />
        </label>

        <label className="field">
          <span>g <InfoHint text="Schwerkraftkonstante fuer die vertikale Beschleunigung." /></span>
          <DraftNumberInput value={settings.g} onCommit={(next) => update("g", next ?? settings.g)} step={0.01} min={1} max={20} />
        </label>

        <label className="field">
          <span>rho <InfoHint text="Luftdichte. Hoehere Dichte vergroessert den Widerstand." /></span>
          <DraftNumberInput value={settings.rho} onCommit={(next) => update("rho", next ?? settings.rho)} step={0.01} min={0.1} max={3} />
        </label>

        <label className="field">
          <span>dt <InfoHint text="Zeitschritt der Integration. Kleinere Werte sind genauer, aber rechenintensiver." /></span>
          <DraftNumberInput value={settings.dt} onCommit={(next) => update("dt", next ?? settings.dt)} step={0.0001} min={0.0005} max={0.01} />
        </label>

        <label className="field">
          <span>maxTimeSec <InfoHint text="Maximale Simulationsdauer. Relevant fuer sehr weite oder langsame Schuesse." /></span>
          <DraftNumberInput value={settings.maxTimeSec} onCommit={(next) => update("maxTimeSec", next ?? settings.maxTimeSec)} step={1} min={5} max={60} />
        </label>

        <label className="field">
          <span>k Override (optional) <InfoHint text="Setzt den gesamten Drag-Term direkt und ueberschreibt damit die Ableitung aus Cw, rho, Querschnitt und Masse." /></span>
          <DraftNumberInput value={settings.kOverride ?? null} onCommit={(next) => update("kOverride", next)} allowEmpty step={0.0001} min={0} />
        </label>
      </div>
    </details>
  )
}
