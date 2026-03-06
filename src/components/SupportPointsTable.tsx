import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import type { HeightDisplayUnit } from "../lib/types"
import type { SupportPoint } from "../types/ballistics"
import { InfoHint } from "./InfoHint"

interface SupportPointsTableProps {
  points: SupportPoint[]
  heightUnit: HeightDisplayUnit
  onExportCsv: () => void
}

export function SupportPointsTable({ points, heightUnit, onExportCsv }: SupportPointsTableProps) {
  return (
    <section className="card">
      <div className="table-header">
        <h2>Stuetzpunkte (alle 2 m) <InfoHint text="Die Tabelle nutzt die Approx-Match-Logik: fuer jede Zieldistanz wird der letzte Simulationspunkt mit x <= Ziel verwendet." /></h2>
        <button type="button" onClick={onExportCsv}>
          CSV Export
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ziel Distanz (m)</th>
              <th>Effektive Distanz x (m)</th>
              <th>Hoehe ({formatHeightUnitLabel(heightUnit)})</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={`${point.targetDistanceM}-${point.effectiveDistanceM}`}>
                <td>{point.targetDistanceM.toFixed(2)}</td>
                <td>{point.effectiveDistanceM.toFixed(4)}</td>
                <td>{metersToHeightUnit(point.heightCm / 100, heightUnit).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
