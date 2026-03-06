import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import type { HeightDisplayUnit } from "../lib/types"
import { InfoHint } from "./InfoHint"

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
        <h3>Distanz Nullpunkt <InfoHint text="Distanz, bei der der Pfeil gemaess Modell wieder die Startlinie erreicht oder schneidet." /></h3>
        <p>{nullDistanceM.toFixed(4)} m</p>
      </article>
      <article>
        <h3>Distanz Scheitelpunkt <InfoHint text="Horizontale Distanz bis zum hoechsten Punkt der Flugbahn." /></h3>
        <p>{apexDistanceM.toFixed(4)} m</p>
      </article>
      <article>
        <h3>Hoehe Scheitelpunkt <InfoHint text="Hoechste erreichte Hoehe relativ zur Startlinie." /></h3>
        <p>{metersToHeightUnit(apexHeightM, heightUnit).toFixed(4)} {formatHeightUnitLabel(heightUnit)}</p>
      </article>
    </section>
  )
}
