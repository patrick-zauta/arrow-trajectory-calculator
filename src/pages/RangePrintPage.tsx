import { useMemo } from "react"
import type { HeightDisplayUnit, RangeCardFormat } from "../lib/types"
import type { RangeCardRow } from "../lib/rangeCard"
import type { SightTapeRow } from "../lib/sightTape"
import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"

type PrintPayload =
  | {
      type: "range-card"
      generatedAt: string
      rows: RangeCardRow[]
      targetHeight_cm: number
      heightDisplayUnit: HeightDisplayUnit
      rangeCardFormat?: RangeCardFormat
    }
  | {
      type: "sight-tape"
      generatedAt: string
      rows: SightTapeRow[]
      heightDisplayUnit: HeightDisplayUnit
      rangeCardFormat?: RangeCardFormat
    }

function getPayload(): PrintPayload | null {
  const raw = localStorage.getItem("range-print-payload")
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PrintPayload | (PrintPayload & { rows?: unknown[] })
    if (!parsed.type) {
      return {
        type: "range-card",
        generatedAt: parsed.generatedAt,
        rows: parsed.rows as RangeCardRow[],
        targetHeight_cm: (parsed as { targetHeight_cm?: number }).targetHeight_cm ?? 0,
        heightDisplayUnit: parsed.heightDisplayUnit,
      }
    }
    return parsed
  } catch {
    return null
  }
}

export function RangePrintPage() {
  const payload = useMemo(() => getPayload(), [])

  return (
    <main className="page print-page">
      <header className="hero no-print">
        <h2>Print View</h2>
        <button type="button" onClick={() => window.print()}>Jetzt drucken</button>
      </header>

      {!payload && <section className="error">Keine Druckdaten vorhanden.</section>}

      {payload?.type === "range-card" && (
        <section className="card">
          <h3>Range Card</h3>
          <p>
            Target Hoehe: {metersToHeightUnit(payload.targetHeight_cm / 100, payload.heightDisplayUnit).toFixed(1)} {formatHeightUnitLabel(payload.heightDisplayUnit)}
            {" "}| erstellt: {payload.generatedAt}
          </p>
          <table>
            <thead>
              <tr>
                <th>Distanz (m)</th>
                <th>Drop ({formatHeightUnitLabel(payload.heightDisplayUnit)})</th>
                <th>Holdover ({formatHeightUnitLabel(payload.heightDisplayUnit)})</th>
                <th>Drift ({formatHeightUnitLabel(payload.heightDisplayUnit)})</th>
                <th>Solver Winkel</th>
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => (
                <tr key={row.distance_m}>
                  <td>{row.distance_m.toFixed(1)}</td>
                  <td>{metersToHeightUnit(row.drop_m, payload.heightDisplayUnit).toFixed(3)}</td>
                  <td>{metersToHeightUnit(row.holdover_cm / 100, payload.heightDisplayUnit).toFixed(2)}</td>
                  <td>{metersToHeightUnit(row.drift_cm / 100, payload.heightDisplayUnit).toFixed(2)}</td>
                  <td>{row.solvedAngle_deg === null ? "-" : `${row.solvedAngle_deg.toFixed(2)} deg`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {payload?.type === "sight-tape" && (
        <section className="card">
          <h3>Sight Tape</h3>
          <p>Erstellt: {payload.generatedAt}</p>
          <table>
            <thead>
              <tr>
                <th>Marke</th>
                <th>Distanz (m)</th>
                <th>Holdover ({formatHeightUnitLabel(payload.heightDisplayUnit)})</th>
                <th>Winkel (deg)</th>
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => (
                <tr key={row.mark}>
                  <td>{row.mark}</td>
                  <td>{row.distance_m.toFixed(1)}</td>
                  <td>{metersToHeightUnit(row.holdover_cm / 100, payload.heightDisplayUnit).toFixed(2)}</td>
                  <td>{row.solvedAngle_deg.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}
