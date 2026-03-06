import type { SupportPoint } from "../types/ballistics"

interface SupportPointsTableProps {
  points: SupportPoint[]
  onExportCsv: () => void
}

export function SupportPointsTable({ points, onExportCsv }: SupportPointsTableProps) {
  return (
    <section className="card">
      <div className="table-header">
        <h2>Stuetzpunkte (alle 2 m)</h2>
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
              <th>Hoehe (cm)</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={`${point.targetDistanceM}-${point.effectiveDistanceM}`}>
                <td>{point.targetDistanceM.toFixed(2)}</td>
                <td>{point.effectiveDistanceM.toFixed(4)}</td>
                <td>{point.heightCm.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}