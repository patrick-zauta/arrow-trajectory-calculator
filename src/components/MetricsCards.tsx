import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import type { HeightDisplayUnit } from "../lib/types"

interface MetricsCardsProps {
  nullDistanceM: number
  apexDistanceM: number
  apexHeightM: number
  heightUnit: HeightDisplayUnit
}

export function MetricsCards({ nullDistanceM, apexDistanceM, apexHeightM, heightUnit }: MetricsCardsProps) {
  return (
    <section className="card metrics-grid">
      <article>
        <h3>Distanz Nullpunkt</h3>
        <p>{nullDistanceM.toFixed(4)} m</p>
      </article>
      <article>
        <h3>Distanz Scheitelpunkt</h3>
        <p>{apexDistanceM.toFixed(4)} m</p>
      </article>
      <article>
        <h3>Hoehe Scheitelpunkt</h3>
        <p>{metersToHeightUnit(apexHeightM, heightUnit).toFixed(4)} {formatHeightUnitLabel(heightUnit)}</p>
      </article>
    </section>
  )
}
