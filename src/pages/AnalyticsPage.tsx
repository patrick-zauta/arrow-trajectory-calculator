import { useMemo, useState } from "react"
import { InfoHint } from "../components/InfoHint"
import { analyzeSensitivity } from "../lib/sensitivity"
import { simulateGrouping } from "../lib/grouping"
import { useAppStore } from "../store/useAppStore"
import { simulateBallistics, findApproxPointAtDistance } from "../lib/ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"

export function AnalyticsPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const presets = useAppStore((state) => state.presets)

  const [targetDistance_m, setTargetDistance] = useState(30)

  const sensitivityRows = useMemo(
    () => analyzeSensitivity(setup, advanced, wind, targetDistance_m),
    [advanced, setup, targetDistance_m, wind],
  )

  const grouping = useMemo(
    () => simulateGrouping(setup, advanced, wind, targetDistance_m, { speed_fps: 4, angle_deg: 0.4, weight_grain: 10, wind_mps: 0.5 }, 25, 42),
    [advanced, setup, targetDistance_m, wind],
  )

  const heatmap = useMemo(() => {
    const distances = [10, 20, 30, 40, 50, 60]
    const selected = [
      { id: "active", name: "Aktiv", setup },
      ...presets.slice(0, 3).map((preset) => ({ id: preset.id, name: preset.name, setup: preset.setup })),
    ]

    return selected.map((entry) => {
      const sim = simulateBallistics(toUserInputs(entry.setup), toAdvancedSettings(advanced), toWindOptions(wind))
      return {
        name: entry.name,
        values: distances.map((distance) => ({
          distance,
          y: findApproxPointAtDistance(sim.points, distance).yM,
        })),
      }
    })
  }, [advanced, presets, setup, wind])

  return (
    <main className="page">
      <header className="hero">
        <h2>Analyse</h2>
        <p>Sensitivity Analysis, Streukreis und Differenz-Heatmap fuer die Bewertung eines Setups.</p>
      </header>

      <section className="card accent-card accent-primary">
        <label className="field">
          <span>Ziel Distanz (m) <InfoHint text="Diese Distanz wird fuer Sensitivity Analysis und Streukreis ausgewertet." /></span>
          <input type="number" value={targetDistance_m} onChange={(event) => setTargetDistance(Number(event.target.value) || 0)} />
        </label>
      </section>

      <section className="card">
        <h3>Sensitivity Analysis <InfoHint text="Zeigt, wie stark kleine Aenderungen der Eingangsparameter das Ergebnis beeinflussen." /></h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Delta</th>
                <th>Nullpunkt Delta (m)</th>
                <th>Hoehe bei Distanz (m)</th>
                <th>Drift Delta (m)</th>
              </tr>
            </thead>
            <tbody>
              {sensitivityRows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.delta}</td>
                  <td>{row.nullDistanceDelta_m.toFixed(3)}</td>
                  <td>{row.heightAtDistanceDelta_m.toFixed(3)}</td>
                  <td>{row.driftDelta_m.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card accent-card accent-cyan">
        <h3>Trefferbild / Streukreis <InfoHint text="Monte-Carlo-Simulation mit kleinen Abweichungen fuer Geschwindigkeit, Winkel, Gewicht und Wind." /></h3>
        <p>Streukreis: {grouping.spreadDiameter_cm.toFixed(2)} cm | mittlere Hoehe: {grouping.meanOffsetY_cm.toFixed(2)} cm</p>
        <svg viewBox="0 0 300 300" width="100%" height="320" role="img" aria-label="Grouping visualization">
          <circle cx="150" cy="150" r="120" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="150" y1="30" x2="150" y2="270" stroke="currentColor" strokeDasharray="4 4" />
          <line x1="30" y1="150" x2="270" y2="150" stroke="currentColor" strokeDasharray="4 4" />
          {grouping.shots.map((shot, index) => (
            <circle key={`${shot.x_m}-${shot.y_m}-${index}`} cx={150 + shot.x_m * 40} cy={150 - shot.y_m * 10} r="4" fill="#22d3ee" />
          ))}
        </svg>
      </section>

      <section className="card accent-card accent-amber">
        <h3>Differenz-Heatmap <InfoHint text="Vergleicht die Hoehe mehrerer Setups ueber eine feste Distanzreihe." /></h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Setup</th>
                <th>10 m</th>
                <th>20 m</th>
                <th>30 m</th>
                <th>40 m</th>
                <th>50 m</th>
                <th>60 m</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  {row.values.map((value) => (
                    <td
                      key={`${row.name}-${value.distance}`}
                      style={{ background: `rgba(34, 211, 238, ${Math.min(0.7, Math.abs(value.y) / 15)})` }}
                    >
                      {value.y.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
