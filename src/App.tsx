import { useMemo, useState } from "react"

type Calculation = {
  distance: number
  dropAtDistance: number
}

function App() {
  const [speed, setSpeed] = useState(70)
  const [distance, setDistance] = useState(30)

  const result = useMemo<Calculation>(() => {
    const g = 9.81
    const t = distance / speed
    const dropAtDistance = 0.5 * g * t * t

    return {
      distance,
      dropAtDistance,
    }
  }, [distance, speed])

  return (
    <main className="container">
      <h1>Arrow Trajectory Calculator</h1>
      <p className="lead">Simple ballistic estimate without drag.</p>

      <section className="card">
        <label>
          Arrow speed (m/s)
          <input
            type="number"
            min={1}
            step={0.5}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value) || 1)}
          />
        </label>

        <label>
          Distance (m)
          <input
            type="number"
            min={1}
            step={0.5}
            value={distance}
            onChange={(event) => setDistance(Number(event.target.value) || 1)}
          />
        </label>
      </section>

      <section className="result" aria-live="polite">
        <strong>Estimated drop:</strong> {result.dropAtDistance.toFixed(3)} m at {result.distance} m
      </section>
    </main>
  )
}

export default App