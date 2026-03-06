import {
  CartesianGrid,
  DotProps,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useMemo, useState } from "react"
import type { HeightDisplayUnit } from "../lib/types"
import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import type { CurveRangeMode } from "../types/ballistics"
import { InfoHint } from "./InfoHint"

export interface TrajectoryChartPoint {
  xM: number
  yM: number
  timeSec: number
  vxMs: number
  vyMs: number
  speedMs: number
  kineticEnergyJ: number
}

interface TrajectoryChartProps {
  data: TrajectoryChartPoint[]
  rangeMode: CurveRangeMode
  heightUnit: HeightDisplayUnit
  onToggleRange: () => void
}

interface RechartsTooltipPayload {
  payload?: TrajectoryChartPoint
}

interface RechartsMouseState {
  isTooltipActive?: boolean
  activePayload?: RechartsTooltipPayload[]
}

function formatValue(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return "-"
  }

  return value.toFixed(digits)
}

function TrajectoryTooltip({
  active,
  payload,
  heightUnit,
}: {
  active?: boolean
  payload?: RechartsTooltipPayload[]
  heightUnit: HeightDisplayUnit
}) {
  const point = payload?.[0]?.payload

  if (!active || !point) {
    return null
  }

  return (
    <div className="chart-tooltip">
      <strong>Punktdaten</strong>
      <div>Distanz: {formatValue(point.xM, 2)} m</div>
      <div>Hoehe: {formatValue(metersToHeightUnit(point.yM, heightUnit), 2)} {formatHeightUnitLabel(heightUnit)}</div>
      <div>Zeit: {formatValue(point.timeSec, 3)} s</div>
      <div>Geschwindigkeit: {formatValue(point.speedMs, 2)} m/s</div>
      <div>vx: {formatValue(point.vxMs, 2)} m/s</div>
      <div>vy: {formatValue(point.vyMs, 2)} m/s</div>
      <div>Kinetische Energie: {formatValue(point.kineticEnergyJ, 2)} J</div>
    </div>
  )
}

function ActiveVectorDot(props: DotProps & { payload?: TrajectoryChartPoint }) {
  const { cx, cy, payload } = props

  if (typeof cx !== "number" || typeof cy !== "number" || !payload) {
    return null
  }

  const vectorMagnitude = Math.sqrt(payload.vxMs * payload.vxMs + payload.vyMs * payload.vyMs)
  const vectorLengthPx = 28
  const ux = vectorMagnitude > 0 ? payload.vxMs / vectorMagnitude : 0
  const uy = vectorMagnitude > 0 ? payload.vyMs / vectorMagnitude : 0

  const vectorEndX = cx + ux * vectorLengthPx
  const vectorEndY = cy - uy * vectorLengthPx
  const componentEndX = cx + ux * vectorLengthPx
  const componentEndY = cy

  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill="#4f46e5" stroke="#ffffff" strokeWidth={1.5} />
      <line x1={cx} y1={cy} x2={componentEndX} y2={componentEndY} stroke="#9ca3af" strokeDasharray="4 3" />
      <line x1={componentEndX} y1={componentEndY} x2={vectorEndX} y2={vectorEndY} stroke="#9ca3af" strokeDasharray="4 3" />
      <line x1={cx} y1={cy} x2={vectorEndX} y2={vectorEndY} stroke="#22d3ee" strokeWidth={2} />
      <circle cx={vectorEndX} cy={vectorEndY} r={3} fill="#22d3ee" />
    </g>
  )
}

export function TrajectoryChart({ data, rangeMode, heightUnit, onToggleRange }: TrajectoryChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryChartPoint | null>(null)

  const buttonLabel =
    rangeMode === "apex"
      ? "Ansicht: Bis Scheitelpunkt (wechseln zu Nullpunkt)"
      : "Ansicht: Bis Nullpunkt (wechseln zu Scheitelpunkt)"

  const xMaxDomain = useMemo(() => {
    const maxX = data.reduce((currentMax, point) => Math.max(currentMax, point.xM), 0)
    const padded = maxX * 1.05

    if (!Number.isFinite(padded) || padded <= 0) {
      return 1
    }

    return padded
  }, [data])

  const yMaxDomain = useMemo(() => {
    const maxY = data.reduce((currentMax, point) => Math.max(currentMax, point.yM), 0)
    const padded = maxY * 1.05

    if (!Number.isFinite(padded) || padded <= 0) {
      return 1
    }

    return padded
  }, [data])

  const handleMouseMove = (nextState: RechartsMouseState) => {
    const nextPoint = nextState.activePayload?.[0]?.payload
    if (nextState.isTooltipActive && nextPoint) {
      setHoveredPoint(nextPoint)
      return
    }

    setHoveredPoint(null)
  }

  return (
    <section className="card chart-card">
      <div className="chart-header">
        <h2>
          Flugkurve{" "}
          <InfoHint text="Die Kurve startet immer bei 0 m Distanz und 0 Hoehe. Die Achsen skalieren automatisch auf maximale Distanz und maximale Hoehe plus 5 Prozent Reserve." />
        </h2>
        <button type="button" onClick={onToggleRange}>
          {buttonLabel}
        </button>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="xM"
              type="number"
              domain={[0, xMaxDomain]}
              label={{ value: "Distanz (m)", position: "insideBottom", offset: -4 }}
              tickFormatter={(value) => Number(value).toFixed(1)}
            />
            <YAxis
              dataKey="yM"
              type="number"
              domain={[0, yMaxDomain]}
              label={{ value: `Hoehe (${formatHeightUnitLabel(heightUnit)})`, angle: -90, position: "insideLeft" }}
              tickFormatter={(value) => metersToHeightUnit(Number(value), heightUnit).toFixed(1)}
            />
            <Tooltip content={<TrajectoryTooltip heightUnit={heightUnit} />} />
            <Line
              type="monotone"
              dataKey="yM"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              activeDot={(dotProps) => <ActiveVectorDot {...dotProps} />}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-hover-stats">
        {hoveredPoint ? (
          <>
            <strong>Aktiver Punkt</strong>
            <span>x: {formatValue(hoveredPoint.xM, 2)} m</span>
            <span>y: {formatValue(metersToHeightUnit(hoveredPoint.yM, heightUnit), 2)} {formatHeightUnitLabel(heightUnit)}</span>
            <span>v: {formatValue(hoveredPoint.speedMs, 2)} m/s</span>
            <span>KE: {formatValue(hoveredPoint.kineticEnergyJ, 2)} J</span>
          </>
        ) : (
          <span>
            Mit der Maus auf die Parabel fahren, um Vektor und Live-Stats zu sehen.{" "}
            <InfoHint text="Beim Hover werden Geschwindigkeitsvektor, Distanz, Hoehe, Zeit, Geschwindigkeit und kinetische Energie des aktuellen Punktes angezeigt." />
          </span>
        )}
      </div>
    </section>
  )
}
