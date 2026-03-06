import { useMemo, useState } from "react"
import { AngleControl } from "../components/AngleControl"
import { ArrowInputs } from "../components/ArrowInputs"
import { AdvancedSettingsPanel } from "../components/AdvancedSettingsPanel"
import { MetricsCards } from "../components/MetricsCards"
import { SupportPointsTable } from "../components/SupportPointsTable"
import { TrajectoryChart } from "../components/TrajectoryChart"
import type { TrajectoryChartPoint } from "../components/TrajectoryChart"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { findApproxPointAtDistance, buildSupportPoints, filterCurvePoints, simulateBallistics } from "../lib/ballistics"
import { calibrateFromMeasurement, type CalibrationTarget } from "../lib/calibration"
import { supportPointsToCsv } from "../lib/csv"
import { fpsToMps, mpsToFps } from "../lib/units"
import { validateInputs } from "../lib/validation"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import type { AngleInputMode, CurveRangeMode, SpeedUnit } from "../types/ballistics"
import { useAppStore } from "../store/useAppStore"

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

export function FlightPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const presets = useAppStore((state) => state.presets)
  const activePresetId = useAppStore((state) => state.activePresetId)

  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)
  const updateWind = useAppStore((state) => state.updateWind)
  const applyPreset = useAppStore((state) => state.applyPreset)
  const saveCurrentAsPreset = useAppStore((state) => state.saveCurrentAsPreset)

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

    return pointsForChart.map((point) => {
      const speedMs = Math.sqrt(point.vxMs * point.vxMs + point.vyMs * point.vyMs + point.vzMs * point.vzMs)
      const kineticEnergyJ = 0.5 * massKg * speedMs * speedMs

      return {
        xM: point.xM,
        yM: Math.max(0, point.yM),
        timeSec: point.timeSec,
        vxMs: point.vxMs,
        vyMs: point.vyMs,
        speedMs,
        kineticEnergyJ,
      }
    })
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

  const setSpeedValue = (value: number) => {
    const nextFps = speedUnit === "fps" ? value : mpsToFps(value)
    updateSetup({ v_fps: Math.max(20, Math.min(1200, nextFps)) })
  }

  const speedDisplayValue = speedUnit === "fps" ? setup.v_fps : fpsToMps(setup.v_fps)
  const speedRange = getSpeedRangeForUnit(speedUnit)

  const handleCalibrate = () => {
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

    if (calTarget === "cw") {
      updateAdvanced({ cw: result.calibratedValue, k_override: null })
    } else {
      updateAdvanced({ k_override: result.calibratedValue })
    }

    window.alert(
      `Kalibriert. Vorher Fehler: ${result.errorBefore_m.toFixed(4)} m, Nachher: ${result.errorAfter_m.toFixed(4)} m`,
    )
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
        <p>Hauptrechner fuer Trajektorie, Kennwerte und Drift.</p>
      </header>

      <section className="card quick-actions">
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
      </section>

      <div className="layout-grid">
        <section className="card">
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
          onWeightChange={(value) => updateSetup({ m_grain: Math.max(50, value) })}
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

      <section className="card">
        <h3>Wind und Seitenabweichung</h3>
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
        <p>Drift bei {driftDistanceM.toFixed(1)} m: {driftAtTargetCm.toFixed(2)} cm</p>
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
          />

          <TrajectoryChart
            data={chartSeries}
            rangeMode={curveRangeMode}
            onToggleRange={() => setCurveRangeMode((current) => (current === "apex" ? "zero" : "apex"))}
          />

          <SupportPointsTable
            points={supportPoints}
            onExportCsv={() => triggerCsvDownload("flugkurve-stuetzpunkte.csv", supportPointsToCsv(supportPoints))}
          />
        </>
      )}

      <details className="card">
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
          <button type="button" onClick={handleCalibrate}>Kalibrieren und anwenden</button>
          <button type="button" onClick={savePreset}>Als Preset speichern</button>
        </div>
      </details>
    </main>
  )
}