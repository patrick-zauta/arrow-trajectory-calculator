import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { calculateHoldover, recommendPin, solveAngleForTarget, type AimMode } from "../lib/aim"
import { generateRangeCardRows } from "../lib/rangeCard"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import { useAppStore } from "../store/useAppStore"

function parseDistanceList(value: string): number[] {
  return value
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
}

export function AimPage() {
  const navigate = useNavigate()

  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const heightDisplayUnit = useAppStore((state) => state.heightDisplayUnit)
  const updateSetup = useAppStore((state) => state.updateSetup)
  const setHeightDisplayUnit = useAppStore((state) => state.setHeightDisplayUnit)

  const [targetDistance_m, setTargetDistance] = useState(30)
  const [targetHeight_cm, setTargetHeight] = useState(0)
  const [mode, setMode] = useState<AimMode>("holdover")
  const [pinInput, setPinInput] = useState("20,30,40")
  const [rangeDistances, setRangeDistances] = useState("10,20,30,40,50")
  const [rangeWithSolver, setRangeWithSolver] = useState(false)

  const debounced = useDebouncedValue({ targetDistance_m, targetHeight_cm, pinInput, rangeDistances }, 150)

  const holdover = useMemo(
    () => calculateHoldover(setup, advanced, wind, debounced.targetDistance_m, debounced.targetHeight_cm),
    [advanced, debounced.targetDistance_m, debounced.targetHeight_cm, setup, wind],
  )

  const solverResult = useMemo(
    () => solveAngleForTarget(setup, advanced, wind, debounced.targetDistance_m, debounced.targetHeight_cm),
    [advanced, debounced.targetDistance_m, debounced.targetHeight_cm, setup, wind],
  )

  const pinRecommendation = useMemo(
    () =>
      recommendPin(
        parseDistanceList(debounced.pinInput),
        setup,
        advanced,
        wind,
        debounced.targetDistance_m,
        debounced.targetHeight_cm,
      ),
    [advanced, debounced.pinInput, debounced.targetDistance_m, debounced.targetHeight_cm, setup, wind],
  )

  const rangeRows = useMemo(
    () =>
      generateRangeCardRows(
        parseDistanceList(debounced.rangeDistances),
        debounced.targetHeight_cm,
        setup,
        advanced,
        wind,
        rangeWithSolver,
      ),
    [advanced, debounced.rangeDistances, debounced.targetHeight_cm, rangeWithSolver, setup, wind],
  )

  const savePrintPayload = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      rows: rangeRows,
      targetHeight_cm,
      heightDisplayUnit,
    }

    localStorage.setItem("range-print-payload", JSON.stringify(payload))
    navigate("/range-print")
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Zielhilfe Rechner</h2>
        <p>Holdover, Winkel-Solver und Range Card fuer den aktuellen Active Setup.</p>
        <div className="unit-switch">
          <button
            type="button"
            className={heightDisplayUnit === "cm" ? "active" : ""}
            onClick={() => setHeightDisplayUnit("cm")}
          >
            Ausgabe in cm
          </button>
          <button
            type="button"
            className={heightDisplayUnit === "m" ? "active" : ""}
            onClick={() => setHeightDisplayUnit("m")}
          >
            Ausgabe in m
          </button>
        </div>
      </header>

      <section className="card">
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Ziel Distanz (m)</span>
            <input type="number" value={targetDistance_m} onChange={(event) => setTargetDistance(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Ziel Hoehe (cm, + hoeher)</span>
            <input type="number" value={targetHeight_cm} onChange={(event) => setTargetHeight(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Modus</span>
            <select value={mode} onChange={(event) => setMode(event.target.value as AimMode)}>
              <option value="holdover">A Holdover berechnen</option>
              <option value="solve-angle">B Winkel berechnen</option>
            </select>
          </label>
        </div>

        <div className="result-grid">
          <article className="card">
            <h3>Holdover</h3>
            <p>{metersToHeightUnit(holdover.holdover_cm / 100, heightDisplayUnit).toFixed(2)} {formatHeightUnitLabel(heightDisplayUnit)}</p>
            <small>y bei Distanz: {metersToHeightUnit(holdover.yAtTarget_m, heightDisplayUnit).toFixed(3)} {formatHeightUnitLabel(heightDisplayUnit)}</small>
          </article>

          <article className="card">
            <h3>Winkel Solver</h3>
            <p>{solverResult.angle_deg.toFixed(3)}°</p>
            <small>Error: {metersToHeightUnit(solverResult.error_m, heightDisplayUnit).toFixed(2)} {formatHeightUnitLabel(heightDisplayUnit)}</small>
            <div className="inline-actions">
              <button type="button" onClick={() => updateSetup({ angle_deg: solverResult.angle_deg })}>
                Winkel uebernehmen
              </button>
            </div>
            {!solverResult.reachableInRange && <small>Ziel ggf. ausser Reichweite, bestes Ergebnis wird gezeigt.</small>}
          </article>

          <article className="card">
            <h3>Pin Empfehlung</h3>
            <label className="field">
              <span>Pins (m, comma separated)</span>
              <input value={pinInput} onChange={(event) => setPinInput(event.target.value)} />
            </label>
            {pinRecommendation ? (
              <p>
                Pin {pinRecommendation.pinDistance_m.toFixed(1)} m, Rest-Holdover{" "}
                {metersToHeightUnit(pinRecommendation.residualHoldover_cm / 100, heightDisplayUnit).toFixed(2)} {formatHeightUnitLabel(heightDisplayUnit)}
              </p>
            ) : (
              <p>Keine Pins definiert.</p>
            )}
          </article>
        </div>
      </section>

      <section className="card">
        <h3>Zielscheibe Visualisierung</h3>
        <svg width="100%" height="180" viewBox="0 0 360 180" role="img" aria-label="Target visual">
          <circle cx="90" cy="90" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="90" cy="90" r="35" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="90" cy="90" r="8" fill="currentColor" />
          <line x1="90" y1="90" x2="250" y2={Math.max(20, Math.min(160, 90 - holdover.holdover_cm))} stroke="#22d3ee" strokeWidth="3" />
          <circle cx="250" cy={Math.max(20, Math.min(160, 90 - holdover.holdover_cm))} r="7" fill="#22d3ee" />
          <text x="180" y="20">
            Marker Holdover {metersToHeightUnit(holdover.holdover_cm / 100, heightDisplayUnit).toFixed(1)} {formatHeightUnitLabel(heightDisplayUnit)}
          </text>
        </svg>
      </section>

      <section className="card">
        <h3>Range Card</h3>
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Distanzen (m)</span>
            <input value={rangeDistances} onChange={(event) => setRangeDistances(event.target.value)} />
          </label>
          <label className="field-inline">
            <input type="checkbox" checked={rangeWithSolver} onChange={(event) => setRangeWithSolver(event.target.checked)} />
            Winkel Solver pro Distanz
          </label>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Distanz (m)</th>
                <th>Drop ({formatHeightUnitLabel(heightDisplayUnit)})</th>
                <th>Holdover ({formatHeightUnitLabel(heightDisplayUnit)})</th>
                <th>Drift ({formatHeightUnitLabel(heightDisplayUnit)})</th>
                <th>Solver Winkel</th>
              </tr>
            </thead>
            <tbody>
              {rangeRows.map((row) => (
                <tr key={row.distance_m}>
                  <td>{row.distance_m.toFixed(1)}</td>
                  <td>{metersToHeightUnit(row.drop_m, heightDisplayUnit).toFixed(3)}</td>
                  <td>{metersToHeightUnit(row.holdover_cm / 100, heightDisplayUnit).toFixed(2)}</td>
                  <td>{metersToHeightUnit(row.drift_cm / 100, heightDisplayUnit).toFixed(2)}</td>
                  <td>{row.solvedAngle_deg === null ? "-" : `${row.solvedAngle_deg.toFixed(2)}°`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inline-actions">
          <button type="button" onClick={savePrintPayload}>Drucken</button>
          <button type="button" onClick={() => window.alert("Nutze im Druckdialog 'Als PDF speichern'.")}>Als PDF speichern</button>
        </div>
      </section>
    </main>
  )
}
