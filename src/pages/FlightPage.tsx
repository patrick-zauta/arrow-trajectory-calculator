import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AngleControl } from "../components/AngleControl"
import { ArrowInputs } from "../components/ArrowInputs"
import { AdvancedSettingsPanel } from "../components/AdvancedSettingsPanel"
import { MetricsCards } from "../components/MetricsCards"
import { SupportPointsTable } from "../components/SupportPointsTable"
import { TrajectoryChart } from "../components/TrajectoryChart"
import type { TrajectoryChartPoint } from "../components/TrajectoryChart"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { buildSupportPoints, filterCurvePoints, findApproxPointAtDistance, simulateBallistics } from "../lib/ballistics"
import { calibrateFromMeasurement, type CalibrationResult, type CalibrationTarget } from "../lib/calibration"
import { supportPointsToCsv } from "../lib/csv"
import type { AdvancedParams, HeightDisplayUnit, Preset } from "../lib/types"
import { formatHeightUnitLabel, fpsToMps, metersToHeightUnit, mpsToFps } from "../lib/units"
import { validateInputs } from "../lib/validation"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import type { AngleInputMode, CurveRangeMode, SpeedUnit } from "../types/ballistics"
import { useAppStore } from "../store/useAppStore"

interface CalibrationPreview {
  result: CalibrationResult
  calibratedAdvanced: AdvancedParams
  chartData: Array<{ xM: number; beforeY: number; afterY: number; targetY: number }>
}

function triggerCsvDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downsamplePoints<T>(points: T[], targetCount: number): T[] {
  if (points.length <= targetCount || targetCount <= 1) {
    return points
  }

  const step = Math.ceil(points.length / targetCount)
  const sampled = points.filter((_, index) => index % step === 0)

  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1])
  }

  return sampled
}

function getSpeedRangeForUnit(unit: SpeedUnit): { min: number; max: number } {
  if (unit === "fps") {
    return { min: 20, max: 1200 }
  }

  return {
    min: fpsToMps(20),
    max: fpsToMps(1200),
  }
}

function buildCalibrationChartData(
  beforePoints: TrajectoryChartPoint[],
  afterPoints: TrajectoryChartPoint[],
  targetY_m: number,
  targetDistance_m: number,
): Array<{ xM: number; beforeY: number; afterY: number; targetY: number }> {
  const maxDistance = Math.max(
    targetDistance_m * 1.2,
    beforePoints[beforePoints.length - 1]?.xM ?? 0,
    afterPoints[afterPoints.length - 1]?.xM ?? 0,
  )
  const steps = Math.max(40, Math.min(160, Math.ceil(maxDistance / 1.5)))
  const rows: Array<{ xM: number; beforeY: number; afterY: number; targetY: number }> = []

  for (let index = 0; index <= steps; index += 1) {
    const xM = (maxDistance / steps) * index
    rows.push({
      xM,
      beforeY: findApproxPointAtDistance(
        beforePoints.map((point) => ({
          timeSec: point.timeSec,
          xM: point.xM,
          yM: point.yM,
          zM: 0,
          vxMs: point.vxMs,
          vyMs: point.vyMs,
          vzMs: 0,
        })),
        xM,
      ).yM,
      afterY: findApproxPointAtDistance(
        afterPoints.map((point) => ({
          timeSec: point.timeSec,
          xM: point.xM,
          yM: point.yM,
          zM: 0,
          vxMs: point.vxMs,
          vyMs: point.vyMs,
          vzMs: 0,
        })),
        xM,
      ).yM,
      targetY: targetY_m,
    })
  }

  return rows
}

function toChartPoints(points: Array<{
  xM: number
  yM: number
  timeSec: number
  vxMs: number
  vyMs: number
  vzMs: number
}>, massKg: number): TrajectoryChartPoint[] {
  return points.map((point) => {
    const speedMs = Math.sqrt(point.vxMs * point.vxMs + point.vyMs * point.vyMs + point.vzMs * point.vzMs)

    return {
      xM: point.xM,
      yM: Math.max(0, point.yM),
      timeSec: point.timeSec,
      vxMs: point.vxMs,
      vyMs: point.vyMs,
      speedMs,
      kineticEnergyJ: 0.5 * massKg * speedMs * speedMs,
    }
  })
}

function formatVerticalValue(valueM: number, unit: HeightDisplayUnit): string {
  return `${metersToHeightUnit(valueM, unit).toFixed(2)} ${formatHeightUnitLabel(unit)}`
}

export function FlightPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const presets = useAppStore((state) => state.presets)
  const activePresetId = useAppStore((state) => state.activePresetId)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const heightDisplayUnit = useAppStore((state) => state.heightDisplayUnit)

  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)
  const updateWind = useAppStore((state) => state.updateWind)
  const applyPreset = useAppStore((state) => state.applyPreset)
  const saveCurrentAsPreset = useAppStore((state) => state.saveCurrentAsPreset)
  const upsertPreset = useAppStore((state) => state.upsertPreset)
  const applyArrowBuild = useAppStore((state) => state.applyArrowBuild)
  const setHeightDisplayUnit = useAppStore((state) => state.setHeightDisplayUnit)

  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("fps")
  const [angleMode, setAngleMode] = useState<AngleInputMode>("direct")
  const [fineStep, setFineStep] = useState<0.1 | 0.01>(0.1)
  const [curveRangeMode, setCurveRangeMode] = useState<CurveRangeMode>("apex")
  const [performanceMode, setPerformanceMode] = useState(false)
  const [driftDistanceM, setDriftDistanceM] = useState(50)

  const [calDistanceM, setCalDistanceM] = useState(30)
  const [calDropCm, setCalDropCm] = useState(25)
  const [calTarget, setCalTarget] = useState<CalibrationTarget>("cw")
  const [calSignMode, setCalSignMode] = useState<"auto-negative" | "manual">("auto-negative")
  const [calManualSign, setCalManualSign] = useState<1 | -1>(-1)
  const [calibrationPreview, setCalibrationPreview] = useState<CalibrationPreview | null>(null)

  const debouncedState = useDebouncedValue({ setup, advanced, wind }, 150)

  const validation = useMemo(
    () => validateInputs(toUserInputs(debouncedState.setup), toAdvancedSettings(debouncedState.advanced)),
    [debouncedState],
  )

  const simulation = useMemo(() => {
    if (validation.errors.length > 0) {
      return null
    }

    return simulateBallistics(
      toUserInputs(debouncedState.setup),
      toAdvancedSettings(debouncedState.advanced),
      toWindOptions(debouncedState.wind),
    )
  }, [debouncedState, validation.errors.length])

  const calmSimulation = useMemo(() => {
    if (validation.errors.length > 0) {
      return null
    }

    return simulateBallistics(
      toUserInputs(debouncedState.setup),
      toAdvancedSettings(debouncedState.advanced),
      { enabled: false, windSpeedMps: 0, windDirectionDeg: 90 },
    )
  }, [debouncedState.advanced, debouncedState.setup, validation.errors.length])

  const visibleEndDistanceM = useMemo(() => {
    if (!simulation) {
      return 0
    }

    return curveRangeMode === "apex" ? simulation.apexDistanceM : simulation.nullDistanceM
  }, [curveRangeMode, simulation])

  const visiblePoints = useMemo(() => {
    if (!simulation) {
      return []
    }

    return filterCurvePoints(simulation.points, visibleEndDistanceM)
  }, [simulation, visibleEndDistanceM])

  const pointsForChart = useMemo(
    () => (performanceMode ? downsamplePoints(visiblePoints, 220) : visiblePoints),
    [performanceMode, visiblePoints],
  )

  const chartSeries = useMemo<TrajectoryChartPoint[]>(() => {
    const massKg = simulation?.derived.massKg ?? 0
    return toChartPoints(pointsForChart, massKg)
  }, [pointsForChart, simulation?.derived.massKg])

  const supportPoints = useMemo(() => {
    if (!simulation) {
      return []
    }

    return buildSupportPoints(simulation.points, visibleEndDistanceM, 2)
  }, [simulation, visibleEndDistanceM])

  const driftAtTargetCm = useMemo(() => {
    if (!simulation) {
      return 0
    }

    const point = findApproxPointAtDistance(simulation.points, driftDistanceM)
    return point.zM * 100
  }, [driftDistanceM, simulation])

  const driftSeries = useMemo(
    () =>
      pointsForChart.map((point) => ({
        xM: point.xM,
        zM: point.zM,
      })),
    [pointsForChart],
  )

  const rangeDeltaM = useMemo(() => {
    if (!simulation || !calmSimulation) {
      return 0
    }

    return simulation.nullDistanceM - calmSimulation.nullDistanceM
  }, [calmSimulation, simulation])

  const setSpeedValue = (value: number) => {
    const nextFps = speedUnit === "fps" ? value : mpsToFps(value)
    updateSetup({ v_fps: Math.max(20, Math.min(1200, nextFps)) })
  }

  const speedDisplayValue = speedUnit === "fps" ? setup.v_fps : fpsToMps(setup.v_fps)
  const speedRange = getSpeedRangeForUnit(speedUnit)

  const runCalibration = () => {
    if (!simulation) {
      return
    }

    const result = calibrateFromMeasurement({
      setup,
      advanced,
      wind,
      measuredDistance_m: calDistanceM,
      measuredDrop_cm: calDropCm,
      signMode: calSignMode,
      measuredDropSign: calManualSign,
      calibrationTarget: calTarget,
      cwRange: { min: 0.5, max: 5.0 },
      kRange: { min: 0.0001, max: 0.05 },
      maxIter: 50,
    })

    const calibratedAdvanced: AdvancedParams =
      calTarget === "cw"
        ? { ...advanced, cw: result.calibratedValue, k_override: null }
        : { ...advanced, k_override: result.calibratedValue }

    const calibratedSimulation = simulateBallistics(
      toUserInputs(setup),
      toAdvancedSettings(calibratedAdvanced),
      toWindOptions(wind),
    )

    const beforePoints = toChartPoints(
      filterCurvePoints(simulation.points, Math.max(calDistanceM * 1.2, simulation.nullDistanceM)),
      simulation.derived.massKg,
    )
    const afterPoints = toChartPoints(
      filterCurvePoints(calibratedSimulation.points, Math.max(calDistanceM * 1.2, calibratedSimulation.nullDistanceM)),
      calibratedSimulation.derived.massKg,
    )

    setCalibrationPreview({
      result,
      calibratedAdvanced,
      chartData: buildCalibrationChartData(beforePoints, afterPoints, result.targetY_m, calDistanceM),
    })
  }

  const applyCalibration = () => {
    if (!calibrationPreview) {
      return
    }

    updateAdvanced(calibrationPreview.calibratedAdvanced)
  }

  const saveCalibratedPreset = () => {
    if (!calibrationPreview) {
      return
    }

    const name = window.prompt("Preset Name fuer kalibriertes Setup")
    if (!name) {
      return
    }

    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      setup: { ...setup },
      advanced: { ...calibrationPreview.calibratedAdvanced },
      wind: { ...wind },
      isSystem: false,
    }

    upsertPreset(preset)
    window.alert("Kalibriertes Preset gespeichert")
  }

  const copyValues = async () => {
    const payload = {
      setup,
      advanced,
      wind,
    }

    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }

  const savePreset = () => {
    const name = window.prompt("Preset Name")
    if (!name) {
      return
    }

    saveCurrentAsPreset(name)
  }

  const dtSteps = Math.ceil(advanced.maxTimeSec / advanced.dt)

  return (
    <main className="page">
      <header className="hero">
        <h2>Flugparabel</h2>
        <p>Hauptrechner fuer Trajektorie, Kennwerte, Wind und Drift.</p>
        <div className="hero-meta">
          <span>Idee: Guido Zauta</span>
          <span>Umsetzung: Patrick Zauta</span>
          <span>Aktiver Pfeil: {arrowBuilds.find((build) => build.id === activeArrowBuildId)?.name ?? "Kein Profil"}</span>
        </div>
      </header>

      <section className="dashboard-strip">
        <article className="dashboard-stat">
          <span className="dashboard-label">Aktives Preset</span>
          <strong>{presets.find((preset) => preset.id === activePresetId)?.name ?? "Kein Preset"}</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Simulation</span>
          <strong>{advanced.simulationMode === "physics" ? "Physik sauber" : "Referenzmodus"}</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Geschwindigkeit</span>
          <strong>{speedDisplayValue.toFixed(1)} {speedUnit}</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Gewicht</span>
          <strong>{setup.m_grain.toFixed(1)} grain</strong>
        </article>
      </section>

      <section className="card quick-actions accent-card accent-primary">
        <button type="button" onClick={() => applyPreset(activePresetId)}>
          Reset auf Preset
        </button>
        <button type="button" onClick={copyValues}>
          Copy Werte
        </button>
        <button type="button" onClick={savePreset}>
          Save Preset
        </button>
        <button type="button" className={performanceMode ? "active" : ""} onClick={() => setPerformanceMode((current) => !current)}>
          Performance Mode
        </button>
        <div className="unit-switch">
          <button
            type="button"
            className={heightDisplayUnit === "cm" ? "active" : ""}
            onClick={() => setHeightDisplayUnit("cm")}
          >
            Hoehe in cm
          </button>
          <button
            type="button"
            className={heightDisplayUnit === "m" ? "active" : ""}
            onClick={() => setHeightDisplayUnit("m")}
          >
            Hoehe in m
          </button>
        </div>
      </section>

      <div className="layout-grid">
        <section className="card panel-lift">
          <h3>Preset</h3>
          <label className="field">
            <span>Auswahl</span>
            <select value={activePresetId} onChange={(event) => applyPreset(event.target.value)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Aktiver Pfeil</span>
            <select value={activeArrowBuildId} onChange={(event) => applyArrowBuild(event.target.value)}>
              {arrowBuilds.map((build) => (
                <option key={build.id} value={build.id}>
                  {build.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <ArrowInputs
          speedValue={speedDisplayValue}
          speedUnit={speedUnit}
          speedMin={speedRange.min}
          speedMax={speedRange.max}
          diameterMm={setup.d_mm}
          weightGrain={setup.m_grain}
          onSpeedValueChange={setSpeedValue}
          onSpeedUnitChange={(unit) => setSpeedUnit(unit)}
          onDiameterChange={(value) => updateSetup({ d_mm: Math.max(2, value) })}
          onWeightChange={(value) => updateSetup({ m_grain: Number.isFinite(value) ? value : 0 })}
        />

        <AngleControl
          angleDeg={setup.angle_deg}
          mode={angleMode}
          fineStep={fineStep}
          onModeChange={setAngleMode}
          onAngleChange={(value) => updateSetup({ angle_deg: Math.max(0, Math.min(90, value)) })}
          onFineStepChange={setFineStep}
        />

        <AdvancedSettingsPanel
          settings={toAdvancedSettings(advanced)}
          onSettingsChange={(next) =>
            updateAdvanced({
              cw: next.cw,
              rho: next.rho,
              g: next.g,
              dt: next.dt,
              maxTimeSec: next.maxTimeSec,
              k_override: next.kOverride ?? null,
              simulationMode: next.simulationMode ?? "excel",
            })
          }
        />
      </div>

      <section className="card accent-card accent-cyan">
        <div className="table-header">
          <div>
            <h3>Wind und Seitenabweichung</h3>
            <p>
              Ruecken- und Gegenwind beeinflussen die Reichweite. Seitenwind erzeugt zusaetzlich einen lateralen Drift.
            </p>
          </div>
          <div className="hero-meta">
            <span>Reichweiten-Effekt: {rangeDeltaM >= 0 ? "+" : ""}{rangeDeltaM.toFixed(2)} m</span>
            <span>Seitlicher Versatz: {formatVerticalValue(driftAtTargetCm / 100, heightDisplayUnit)}</span>
          </div>
        </div>
        <div className="inline-grid">
          <label className="field-inline">
            <input
              type="checkbox"
              checked={wind.enabled}
              onChange={(event) => updateWind({ enabled: event.target.checked })}
            />
            Wind aktiv
          </label>
          <label className="field">
            <span>Windgeschwindigkeit (m/s)</span>
            <input
              type="number"
              value={wind.windSpeed_mps}
              step={0.1}
              onChange={(event) => updateWind({ windSpeed_mps: Number(event.target.value) || 0 })}
            />
          </label>
          <label className="field">
            <span>Windrichtung (deg)</span>
            <input
              type="number"
              value={wind.windDirection_deg}
              step={1}
              onChange={(event) => updateWind({ windDirection_deg: Number(event.target.value) || 0 })}
            />
          </label>
          <label className="field">
            <span>Ziel Distanz fuer Drift (m)</span>
            <input
              type="number"
              value={driftDistanceM}
              step={1}
              onChange={(event) => setDriftDistanceM(Number(event.target.value) || 0)}
            />
          </label>
        </div>
        <p>
          Drift bei {driftDistanceM.toFixed(1)} m: {formatVerticalValue(driftAtTargetCm / 100, heightDisplayUnit)}
        </p>
        {driftSeries.length > 1 && (
          <div className="chart-wrapper mini-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={driftSeries} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="xM" type="number" domain={[0, "dataMax"]} tickFormatter={(value) => Number(value).toFixed(0)} />
                <YAxis tickFormatter={(value) => metersToHeightUnit(Number(value), heightDisplayUnit).toFixed(1)} />
                <Tooltip
                  formatter={(value: number) => `${metersToHeightUnit(value, heightDisplayUnit).toFixed(2)} ${formatHeightUnitLabel(heightDisplayUnit)}`}
                  labelFormatter={(value) => `Distanz ${Number(value).toFixed(2)} m`}
                />
                <Line type="monotone" dataKey="zM" name="Seitlicher Drift" stroke="#22d3ee" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {(validation.excelWarnings.length > 0 || dtSteps > 30000) && (
        <section className="warning">
          <strong>Hinweis: ausserhalb Referenzbereich.</strong>
          <ul>
            {validation.excelWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            {dtSteps > 30000 && (
              <li>dt erzeugt {dtSteps.toLocaleString()} Schritte. Fuer bessere UI-Performance Performance Mode aktivieren.</li>
            )}
          </ul>
        </section>
      )}

      {validation.errors.length > 0 && (
        <section className="error">
          <strong>Validierungsfehler:</strong>
          <ul>
            {validation.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      )}

      {simulation && (
        <>
          <MetricsCards
            nullDistanceM={simulation.nullDistanceM}
            apexDistanceM={simulation.apexDistanceM}
            apexHeightM={simulation.apexHeightM}
            heightUnit={heightDisplayUnit}
          />

          <TrajectoryChart
            data={chartSeries}
            rangeMode={curveRangeMode}
            heightUnit={heightDisplayUnit}
            onToggleRange={() => setCurveRangeMode((current) => (current === "apex" ? "zero" : "apex"))}
          />

          <SupportPointsTable
            points={supportPoints}
            heightUnit={heightDisplayUnit}
            onExportCsv={() => triggerCsvDownload("flugkurve-stuetzpunkte.csv", supportPointsToCsv(supportPoints))}
          />
        </>
      )}

      <details className="card accent-card accent-amber">
        <summary>Kalibrierung</summary>
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Messdistanz (m)</span>
            <input type="number" value={calDistanceM} onChange={(event) => setCalDistanceM(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Gemessener Drop (cm)</span>
            <input type="number" value={calDropCm} onChange={(event) => setCalDropCm(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Kalibrierziel</span>
            <select value={calTarget} onChange={(event) => setCalTarget(event.target.value as CalibrationTarget)}>
              <option value="cw">Kalibriere Cw</option>
              <option value="k">Kalibriere k direkt</option>
            </select>
          </label>
          <label className="field">
            <span>Drop Interpretation</span>
            <select value={calSignMode} onChange={(event) => setCalSignMode(event.target.value as "auto-negative" | "manual")}>
              <option value="auto-negative">Auto: negativ</option>
              <option value="manual">Manuell</option>
            </select>
          </label>
          {calSignMode === "manual" && (
            <label className="field">
              <span>Manuelles Vorzeichen</span>
              <select value={calManualSign} onChange={(event) => setCalManualSign(Number(event.target.value) as 1 | -1)}>
                <option value={-1}>Negativ</option>
                <option value={1}>Positiv</option>
              </select>
            </label>
          )}
        </div>
        <div className="inline-actions">
          <button type="button" onClick={runCalibration}>Kalibrierung berechnen</button>
          <button type="button" onClick={applyCalibration} disabled={!calibrationPreview}>Kalibrierung anwenden</button>
          <button type="button" onClick={saveCalibratedPreset} disabled={!calibrationPreview}>Als Preset speichern</button>
        </div>

        {calibrationPreview && (
          <div className="stack">
            <div className="result-grid">
              <article className="card">
                <h3>Vorher</h3>
                <p>{calibrationPreview.result.previousValue.toFixed(5)}</p>
                <small>Fehler: {calibrationPreview.result.errorBefore_m.toFixed(4)} m</small>
              </article>
              <article className="card">
                <h3>Nachher</h3>
                <p>{calibrationPreview.result.calibratedValue.toFixed(5)}</p>
                <small>Fehler: {calibrationPreview.result.errorAfter_m.toFixed(4)} m</small>
              </article>
              <article className="card">
                <h3>Zielwert</h3>
                <p>{formatVerticalValue(calibrationPreview.result.targetY_m, heightDisplayUnit)}</p>
                <small>{calibrationPreview.result.usedSignSwitch ? "Binary Search mit Vorzeichenwechsel" : "Best-Fit ohne Vorzeichenwechsel"}</small>
              </article>
            </div>
            <div className="chart-wrapper mini-chart">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={calibrationPreview.chartData} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="xM" tickFormatter={(value) => Number(value).toFixed(0)} />
                  <YAxis tickFormatter={(value) => metersToHeightUnit(Number(value), heightDisplayUnit).toFixed(1)} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      [`${metersToHeightUnit(value, heightDisplayUnit).toFixed(2)} ${formatHeightUnitLabel(heightDisplayUnit)}`, name]
                    }
                    labelFormatter={(value) => `Distanz ${Number(value).toFixed(2)} m`}
                  />
                  <Legend />
                  <ReferenceLine x={calDistanceM} stroke="#f59e0b" strokeDasharray="4 4" label="Messdistanz" />
                  <Line type="monotone" dataKey="beforeY" name="Vorher" stroke="#64748b" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="afterY" name="Nachher" stroke="#10b981" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="targetY" name="Messziel" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </details>
    </main>
  )
}
