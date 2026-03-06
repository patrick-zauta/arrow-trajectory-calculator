import { useEffect, useMemo, useState } from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { findApproxPointAtDistance, simulateBallistics } from "../lib/ballistics"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import type { ArrowSetup } from "../lib/types"
import { useAppStore } from "../store/useAppStore"

interface CompareSetup {
  id: string
  name: string
  color: string
  visible: boolean
  setup: ArrowSetup
}

const COLORS = ["#4f46e5", "#22d3ee", "#f59e0b", "#10b981"]

function cloneSetup(setup: ArrowSetup): ArrowSetup {
  return {
    v_fps: setup.v_fps,
    d_mm: setup.d_mm,
    m_grain: setup.m_grain,
    angle_deg: setup.angle_deg,
  }
}

function buildChartData(
  simulations: Array<{
    entry: CompareSetup
    sim: ReturnType<typeof simulateBallistics>
  }>,
): Array<Record<string, number>> {
  const maxDistance = simulations.reduce((max, current) => Math.max(max, current.sim.nullDistanceM), 0)
  const steps = Math.max(80, Math.min(220, Math.ceil(maxDistance / 1.5)))
  const rows: Array<Record<string, number>> = []

  for (let index = 0; index <= steps; index += 1) {
    const xM = maxDistance <= 0 ? 0 : (maxDistance / steps) * index
    const row: Record<string, number> = { xM }

    simulations.forEach(({ entry, sim }) => {
      if (xM <= sim.points[sim.points.length - 1].xM) {
        row[entry.id] = findApproxPointAtDistance(sim.points, xM).yM
      }
    })

    rows.push(row)
  }

  return rows
}

export function ComparePage() {
  const activeSetup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const presets = useAppStore((state) => state.presets)

  const [setups, setSetups] = useState<CompareSetup[]>([
    { id: "A", name: "Setup A", color: COLORS[0], visible: true, setup: cloneSetup(activeSetup) },
    { id: "B", name: "Setup B", color: COLORS[1], visible: true, setup: cloneSetup(activeSetup) },
  ])
  const [distanceDiff_m, setDistanceDiff] = useState(30)

  useEffect(() => {
    setSetups((current) =>
      current.map((entry) => (entry.id === "A" ? { ...entry, setup: cloneSetup(activeSetup) } : entry)),
    )
  }, [activeSetup])

  const debouncedSetups = useDebouncedValue(setups, 200)

  const simulations = useMemo(
    () =>
      debouncedSetups
        .filter((entry) => entry.visible)
        .map((entry) => {
          const sim = simulateBallistics(toUserInputs(entry.setup), toAdvancedSettings(advanced), toWindOptions(wind))
          return { entry, sim }
        }),
    [advanced, debouncedSetups, wind],
  )

  const chartData = useMemo(() => buildChartData(simulations), [simulations])

  const metrics = useMemo(
    () =>
      simulations.map(({ entry, sim }) => ({
        id: entry.id,
        name: entry.name,
        nullDistanceM: sim.nullDistanceM,
        apexDistanceM: sim.apexDistanceM,
        apexHeightM: sim.apexHeightM,
        yAtDistanceM: findApproxPointAtDistance(sim.points, distanceDiff_m).yM,
      })),
    [distanceDiff_m, simulations],
  )

  const baseline = metrics[0]

  const addSetupFromPreset = (presetId: string) => {
    if (setups.length >= 4) {
      return
    }

    const preset = presets.find((entry) => entry.id === presetId)
    if (!preset) {
      return
    }

    const nextIndex = setups.length
    const nextId = String.fromCharCode(65 + nextIndex)
    setSetups((current) => [
      ...current,
      {
        id: nextId,
        name: `Setup ${nextId}`,
        color: COLORS[nextIndex % COLORS.length],
        visible: true,
        setup: cloneSetup(preset.setup),
      },
    ])
  }

  const duplicateSetupA = () => {
    if (setups.length >= 4) {
      return
    }

    const source = setups.find((entry) => entry.id === "A")
    if (!source) {
      return
    }

    const nextIndex = setups.length
    const nextId = String.fromCharCode(65 + nextIndex)
    setSetups((current) => [
      ...current,
      {
        id: nextId,
        name: `Setup ${nextId}`,
        color: COLORS[nextIndex % COLORS.length],
        visible: true,
        setup: cloneSetup(source.setup),
      },
    ])
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Vergleich</h2>
        <p>Vergleich von zwei bis vier Setups mit Overlay Chart und Kennwerten.</p>
      </header>

      <section className="card">
        <div className="inline-actions">
          <button type="button" onClick={duplicateSetupA} disabled={setups.length >= 4}>
            Setup A duplizieren
          </button>
          <label className="field">
            <span>Setup aus Preset hinzufuegen</span>
            <select onChange={(event) => addSetupFromPreset(event.target.value)} defaultValue="">
              <option value="" disabled>
                Preset waehlen
              </option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="layout-grid">
          {setups.map((entry) => (
            <article className="card" key={entry.id}>
              <div className="table-header">
                <h3>{entry.name}</h3>
                {entry.id !== "A" && (
                  <button type="button" onClick={() => setSetups((current) => current.filter((setup) => setup.id !== entry.id))}>
                    Entfernen
                  </button>
                )}
              </div>
              <label className="field-inline">
                <input
                  type="checkbox"
                  checked={entry.visible}
                  onChange={(event) =>
                    setSetups((current) =>
                      current.map((setup) => (setup.id === entry.id ? { ...setup, visible: event.target.checked } : setup)),
                    )
                  }
                />
                Sichtbar
              </label>
              <label className="field">
                <span>v_fps</span>
                <input
                  type="number"
                  value={entry.setup.v_fps}
                  onChange={(event) =>
                    setSetups((current) =>
                      current.map((setup) =>
                        setup.id === entry.id
                          ? { ...setup, setup: { ...setup.setup, v_fps: Number(event.target.value) || 0 } }
                          : setup,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>d_mm</span>
                <input
                  type="number"
                  value={entry.setup.d_mm}
                  onChange={(event) =>
                    setSetups((current) =>
                      current.map((setup) =>
                        setup.id === entry.id
                          ? { ...setup, setup: { ...setup.setup, d_mm: Number(event.target.value) || 0 } }
                          : setup,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>m_grain</span>
                <input
                  type="number"
                  value={entry.setup.m_grain}
                  onChange={(event) =>
                    setSetups((current) =>
                      current.map((setup) =>
                        setup.id === entry.id
                          ? { ...setup, setup: { ...setup.setup, m_grain: Number(event.target.value) || 0 } }
                          : setup,
                      ),
                    )
                  }
                />
              </label>
              <label className="field">
                <span>angle_deg</span>
                <input
                  type="number"
                  value={entry.setup.angle_deg}
                  onChange={(event) =>
                    setSetups((current) =>
                      current.map((setup) =>
                        setup.id === entry.id
                          ? { ...setup, setup: { ...setup.setup, angle_deg: Number(event.target.value) || 0 } }
                          : setup,
                      ),
                    )
                  }
                />
              </label>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Chart Overlay</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="xM" type="number" domain={[0, "dataMax"]} tickFormatter={(value) => Number(value).toFixed(0)} />
              <YAxis />
              <Tooltip />
              <Legend />
              {simulations.map(({ entry }) => (
                <Line key={entry.id} dataKey={entry.id} stroke={entry.color} dot={false} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h3>Kennwerte</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Setup</th>
                <th>Distanz Nullpunkt (m)</th>
                <th>Distanz Scheitelpunkt (m)</th>
                <th>Hoehe Scheitelpunkt (m)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td>{metric.name}</td>
                  <td>{metric.nullDistanceM.toFixed(3)}</td>
                  <td>{metric.apexDistanceM.toFixed(3)}</td>
                  <td>{metric.apexHeightM.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Differenz Ansicht</h3>
        <label className="field">
          <span>Distanz (m)</span>
          <input type="number" value={distanceDiff_m} onChange={(event) => setDistanceDiff(Number(event.target.value) || 0)} />
        </label>
        {baseline && (
          <ul>
            {metrics.slice(1).map((metric) => (
              <li key={metric.id}>
                {metric.name}: {(metric.yAtDistanceM - baseline.yAtDistanceM).toFixed(3)} m gegenueber {baseline.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
