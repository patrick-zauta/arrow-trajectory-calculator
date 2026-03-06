import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { CurveRangeMode } from "../types/ballistics"

interface TrajectoryChartProps {
  data: Array<{ xM: number; yCm: number }>
  rangeMode: CurveRangeMode
  onToggleRange: () => void
}

export function TrajectoryChart({ data, rangeMode, onToggleRange }: TrajectoryChartProps) {
  const buttonLabel =
    rangeMode === "apex"
      ? "Ansicht: Bis Scheitelpunkt (wechseln zu Nullpunkt)"
      : "Ansicht: Bis Nullpunkt (wechseln zu Scheitelpunkt)"

  return (
    <section className="card chart-card">
      <div className="chart-header">
        <h2>Flugkurve</h2>
        <button type="button" onClick={onToggleRange}>
          {buttonLabel}
        </button>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="xM"
              type="number"
              domain={[0, "dataMax"]}
              label={{ value: "Distanz (m)", position: "insideBottom", offset: -4 }}
              tickFormatter={(value) => Number(value).toFixed(0)}
            />
            <YAxis
              dataKey="yCm"
              type="number"
              domain={["auto", "auto"]}
              label={{ value: "Hoehe (cm)", angle: -90, position: "insideLeft" }}
              tickFormatter={(value) => Number(value).toFixed(0)}
            />
            <Tooltip
              formatter={(value: number) => `${Number(value).toFixed(2)} cm`}
              labelFormatter={(value) => `x = ${Number(value).toFixed(2)} m`}
            />
            <Line
              type="monotone"
              dataKey="yCm"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}