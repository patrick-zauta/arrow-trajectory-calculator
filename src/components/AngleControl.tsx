import type { AngleInputMode } from "../types/ballistics"

interface AngleControlProps {
  angleDeg: number
  mode: AngleInputMode
  fineStep: 0.1 | 0.01
  onModeChange: (nextMode: AngleInputMode) => void
  onAngleChange: (nextValue: number) => void
  onFineStepChange: (nextStep: 0.1 | 0.01) => void
}

export function AngleControl({
  angleDeg,
  mode,
  fineStep,
  onModeChange,
  onAngleChange,
  onFineStepChange,
}: AngleControlProps) {
  const isDirectMode = mode === "direct"

  return (
    <section className="card">
      <h2>Eingabe Abschusswinkel</h2>

      <div className="radio-row">
        <label>
          <input
            type="radio"
            name="angle-mode"
            checked={mode === "fine"}
            onChange={() => onModeChange("fine")}
          />
          Genaue Einstellung
        </label>

        <label>
          <input
            type="radio"
            name="angle-mode"
            checked={mode === "direct"}
            onChange={() => onModeChange("direct")}
          />
          Direkt Eingabe
        </label>
      </div>

      <div className="field-group">
        <label className="field">
          <span>Winkel (Direkt) in Grad</span>
          <input
            type="number"
            value={angleDeg}
            min={0}
            max={90}
            step={0.01}
            disabled={!isDirectMode}
            onChange={(event) => onAngleChange(Number(event.target.value))}
          />
        </label>

        <div className="fine-panel">
          <div className="step-toggle" role="group" aria-label="Feinschritt">
            <button
              type="button"
              className={fineStep === 0.1 ? "active" : ""}
              onClick={() => onFineStepChange(0.1)}
              disabled={isDirectMode}
            >
              Schritt 0.1
            </button>
            <button
              type="button"
              className={fineStep === 0.01 ? "active" : ""}
              onClick={() => onFineStepChange(0.01)}
              disabled={isDirectMode}
            >
              Schritt 0.01
            </button>
          </div>

          <div className="fine-controls">
            <button type="button" disabled={isDirectMode} onClick={() => onAngleChange(angleDeg - fineStep)}>
              -
            </button>
            <input
              type="range"
              min={0}
              max={90}
              step={fineStep}
              value={angleDeg}
              disabled={isDirectMode}
              onChange={(event) => onAngleChange(Number(event.target.value))}
            />
            <button type="button" disabled={isDirectMode} onClick={() => onAngleChange(angleDeg + fineStep)}>
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}