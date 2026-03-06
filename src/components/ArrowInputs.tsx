import type { SpeedUnit } from "../types/ballistics"

interface ArrowInputsProps {
  speedValue: number
  speedUnit: SpeedUnit
  speedMin: number
  speedMax: number
  diameterMm: number
  weightGrain: number
  onSpeedValueChange: (nextValue: number) => void
  onSpeedUnitChange: (nextUnit: SpeedUnit) => void
  onDiameterChange: (nextValue: number) => void
  onWeightChange: (nextValue: number) => void
}

export function ArrowInputs({
  speedValue,
  speedUnit,
  speedMin,
  speedMax,
  diameterMm,
  weightGrain,
  onSpeedValueChange,
  onSpeedUnitChange,
  onDiameterChange,
  onWeightChange,
}: ArrowInputsProps) {
  return (
    <section className="card">
      <h2>Eingabe Pfeilparameter</h2>

      <div className="unit-switch" role="group" aria-label="Geschwindigkeitseinheit">
        <button
          type="button"
          className={speedUnit === "fps" ? "active" : ""}
          onClick={() => onSpeedUnitChange("fps")}
        >
          fps
        </button>
        <button
          type="button"
          className={speedUnit === "mps" ? "active" : ""}
          onClick={() => onSpeedUnitChange("mps")}
        >
          m/s
        </button>
      </div>

      <label className="field">
        <span>Pfeilgeschwindigkeit ({speedUnit === "fps" ? "fps" : "m/s"})</span>
        <input
          type="number"
          value={speedValue}
          min={speedMin}
          max={speedMax}
          step={speedUnit === "fps" ? 1 : 0.1}
          onChange={(event) => onSpeedValueChange(Number(event.target.value))}
        />
      </label>

      <label className="field">
        <span>Pfeildurchmesser (mm)</span>
        <input
          type="number"
          value={diameterMm}
          min={2}
          max={20}
          step={0.1}
          onChange={(event) => onDiameterChange(Number(event.target.value))}
        />
      </label>

      <label className="field">
        <span>Pfeilgewicht (grain)</span>
        <input
          type="number"
          value={weightGrain}
          min={50}
          max={2000}
          step={1}
          onChange={(event) => onWeightChange(Number(event.target.value))}
        />
      </label>
    </section>
  )
}