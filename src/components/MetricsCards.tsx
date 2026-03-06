interface MetricsCardsProps {
  nullDistanceM: number
  apexDistanceM: number
  apexHeightM: number
}

export function MetricsCards({ nullDistanceM, apexDistanceM, apexHeightM }: MetricsCardsProps) {
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
        <p>{apexHeightM.toFixed(4)} m</p>
      </article>
    </section>
  )
}