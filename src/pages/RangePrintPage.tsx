import { useMemo } from "react"
import type { RangeCardRow } from "../lib/rangeCard"

interface PrintPayload {
  generatedAt: string
  rows: RangeCardRow[]
  targetHeight_cm: number
}

function getPayload(): PrintPayload | null {
  const raw = localStorage.getItem("range-print-payload")
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as PrintPayload
  } catch {
    return null
  }
}

export function RangePrintPage() {
  const payload = useMemo(() => getPayload(), [])

  return (
    <main className="page print-page">
      <header className="hero no-print">
        <h2>Range Card Print View</h2>
        <button type="button" onClick={() => window.print()}>Jetzt drucken</button>
      </header>

      {!payload && <section className="error">Keine Range Card Daten vorhanden.</section>}

      {payload && (
        <section className="card">
          <h3>Range Card</h3>
          <p>Target Hoehe: {payload.targetHeight_cm.toFixed(1)} cm | erstellt: {payload.generatedAt}</p>
          <table>
            <thead>
              <tr>
                <th>Distanz (m)</th>
                <th>Drop (m)</th>
                <th>Holdover (cm)</th>
                <th>Drift (cm)</th>
                <th>Solver Winkel</th>
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => (
                <tr key={row.distance_m}>
                  <td>{row.distance_m.toFixed(1)}</td>
                  <td>{row.drop_m.toFixed(3)}</td>
                  <td>{row.holdover_cm.toFixed(2)}</td>
                  <td>{row.drift_cm.toFixed(2)}</td>
                  <td>{row.solvedAngle_deg === null ? "-" : `${row.solvedAngle_deg.toFixed(2)}°`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}