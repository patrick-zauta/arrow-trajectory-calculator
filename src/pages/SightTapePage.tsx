import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { InfoHint } from "../components/InfoHint"
import { generateSightTape } from "../lib/sightTape"
import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import { useAppStore } from "../store/useAppStore"

function parseDistances(value: string): number[] {
  return value.split(",").map((entry) => Number(entry.trim())).filter((entry) => Number.isFinite(entry) && entry > 0)
}

export function SightTapePage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const heightUnit = useAppStore((state) => state.heightDisplayUnit)
  const rangeCardFormat = useAppStore((state) => state.uiPreferences.rangeCardFormat)
  const setRangeCardFormat = useAppStore((state) => state.setRangeCardFormat)

  const [distanceInput, setDistanceInput] = useState("10,20,30,40,50,60")

  const rows = useMemo(
    () => generateSightTape(parseDistances(distanceInput), setup, advanced, wind),
    [advanced, distanceInput, setup, wind],
  )

  const openPrint = () => {
    localStorage.setItem(
      "range-print-payload",
      JSON.stringify({
        type: "sight-tape",
        generatedAt: new Date().toISOString(),
        rows,
        rangeCardFormat,
        heightDisplayUnit: heightUnit,
      }),
    )
    window.location.hash = "#/range-print"
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Sight Tape</h2>
        <p>Erzeugt Visierband- und Holdover-Markierungen fuer frei definierte Distanzen.</p>
      </header>

      <section className="card accent-card accent-primary">
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Distanzen (m) <InfoHint text="Kommagetrennte Distanzliste fuer das Sight Tape und die Druckansicht." /></span>
            <input value={distanceInput} onChange={(event) => setDistanceInput(event.target.value)} />
          </label>
          <label className="field">
            <span>Format <InfoHint text="Das Format steuert die visuelle Verdichtung fuer Druck und Tabellenansicht." /></span>
            <select value={rangeCardFormat} onChange={(event) => setRangeCardFormat(event.target.value as typeof rangeCardFormat)}>
              <option value="compact">Kompakt</option>
              <option value="jagd">Jagd</option>
              <option value="turnier">Turnier</option>
            </select>
          </label>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={openPrint}>Sight Tape drucken</button>
          <Link to="/aim" className="tab-link active">Zur Zielhilfe</Link>
        </div>
      </section>

      <section className="card">
        <h3>Sight Tape Tabelle <InfoHint text="Marken, Holdover und Solver-Winkel fuer jede Distanz. Geeignet fuer Ausdruck oder als Referenz am Bogen." /></h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Marke</th>
                <th>Distanz (m)</th>
                <th>Holdover ({formatHeightUnitLabel(heightUnit)})</th>
                <th>Winkel (deg)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.mark}>
                  <td>{row.mark}</td>
                  <td>{row.distance_m.toFixed(1)}</td>
                  <td>{metersToHeightUnit(row.holdover_cm / 100, heightUnit).toFixed(2)}</td>
                  <td>{row.solvedAngle_deg.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
