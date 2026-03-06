import { useMemo, useState } from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Link } from "react-router-dom"
import { AdvancedSettingsPanel } from "../components/AdvancedSettingsPanel"
import { AngleControl } from "../components/AngleControl"
import { ArrowInputs } from "../components/ArrowInputs"
import { InfoHint } from "../components/InfoHint"
import { MetricsCards } from "../components/MetricsCards"
import { SupportPointsTable } from "../components/SupportPointsTable"
import { TrajectoryChart } from "../components/TrajectoryChart"
import type { TrajectoryChartPoint } from "../components/TrajectoryChart"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { buildSupportPoints, filterCurvePoints, findApproxPointAtDistance, simulateBallistics } from "../lib/ballistics"
import { supportPointsToCsv } from "../lib/csv"
import { buildTerrainSeries, findTerrainImpact, terrainHeightAtDistance } from "../lib/terrain"
import type { HeightDisplayUnit } from "../lib/types"
import { solveZeroDistance } from "../lib/zeroing"
import { formatHeightUnitLabel, fpsToMps, metersToHeightUnit, mpsToFps } from "../lib/units"
import { validateInputs } from "../lib/validation"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import { useAppStore } from "../store/useAppStore"
import type { AngleInputMode, CurveRangeMode, SpeedUnit } from "../types/ballistics"

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
  return unit === "fps" ? { min: 20, max: 1200 } : { min: fpsToMps(20), max: fpsToMps(1200) }
}

function toChartPoints(
  points: Array<{ xM: number; yM: number; zM: number; timeSec: number; vxMs: number; vyMs: number; vzMs: number }>,
  massKg: number,
): TrajectoryChartPoint[] {
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
  const terrain = useAppStore((state) => state.terrain)
  const presets = useAppStore((state) => state.presets)
  const activePresetId = useAppStore((state) => state.activePresetId)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const heightDisplayUnit = useAppStore((state) => state.heightDisplayUnit)
  const chartMetric = useAppStore((state) => state.uiPreferences.chartMetric)
  const performanceMode = useAppStore((state) => state.uiPreferences.performanceMode)

  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)
  const updateWind = useAppStore((state) => state.updateWind)
  const updateTerrain = useAppStore((state) => state.updateTerrain)
  const applyPreset = useAppStore((state) => state.applyPreset)
  const saveCurrentAsPreset = useAppStore((state) => state.saveCurrentAsPreset)
  const applyArrowBuild = useAppStore((state) => state.applyArrowBuild)
  const setHeightDisplayUnit = useAppStore((state) => state.setHeightDisplayUnit)
  const setChartMetric = useAppStore((state) => state.setChartMetric)
  const setPerformanceMode = useAppStore((state) => state.setPerformanceMode)

  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>("fps")
  const [angleMode, setAngleMode] = useState<AngleInputMode>("direct")
  const [fineStep, setFineStep] = useState<0.1 | 0.01>(0.1)
  const [curveRangeMode, setCurveRangeMode] = useState<CurveRangeMode>("apex")
  const [driftDistanceM, setDriftDistanceM] = useState(50)
  const [zeroDistanceM, setZeroDistanceM] = useState(30)
  const [zeroTargetHeightCm, setZeroTargetHeightCm] = useState(0)

  const debouncedState = useDebouncedValue({ setup, advanced, wind, terrain }, 150)

  const validation = useMemo(
    () => validateInputs(toUserInputs(debouncedState.setup), toAdvancedSettings(debouncedState.advanced)),
    [debouncedState],
  )

  const simulation = useMemo(() => {
    if (validation.errors.length > 0) {
      return null
    }
    return simulateBallistics(toUserInputs(debouncedState.setup), toAdvancedSettings(debouncedState.advanced), toWindOptions(debouncedState.wind))
  }, [debouncedState, validation.errors.length])

  const calmSimulation = useMemo(() => {
    if (validation.errors.length > 0) {
      return null
    }
    return simulateBallistics(toUserInputs(debouncedState.setup), toAdvancedSettings(debouncedState.advanced), { enabled: false, windSpeedMps: 0, windDirectionDeg: 90 })
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

  const driftSeries = useMemo(() => pointsForChart.map((point) => ({ xM: point.xM, zM: point.zM })), [pointsForChart])

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

  const metricSeries = useMemo(() => {
    const massKg = simulation?.derived.massKg ?? 0
    return pointsForChart.map((point) => {
      const speed = Math.sqrt(point.vxMs * point.vxMs + point.vyMs * point.vyMs + point.vzMs * point.vzMs)
      const energy = 0.5 * massKg * speed * speed
      const impulse = massKg * speed
      return {
        xM: point.xM,
        value:
          chartMetric === "speed"
            ? speed
            : chartMetric === "energy"
              ? energy
              : chartMetric === "impulse"
                ? impulse
                : chartMetric === "drift"
                  ? point.zM
                  : point.yM,
      }
    })
  }, [chartMetric, pointsForChart, simulation?.derived.massKg])

  const terrainSeries = useMemo(
    () => buildTerrainSeries(visibleEndDistanceM, terrain, 100).map((entry) => ({
      xM: entry.xM,
      terrainY: entry.terrainY,
      trajectoryY: findApproxPointAtDistance(pointsForChart, entry.xM).yM,
    })),
    [pointsForChart, terrain, visibleEndDistanceM],
  )

  const terrainImpact = useMemo(() => (simulation ? findTerrainImpact(simulation.points, terrain) : null), [simulation, terrain])

  const zeroingResult = useMemo(
    () => solveZeroDistance(setup, advanced, wind, zeroDistanceM, zeroTargetHeightCm),
    [advanced, setup, wind, zeroDistanceM, zeroTargetHeightCm],
  )

  const copyValues = async () => {
    await navigator.clipboard.writeText(JSON.stringify({ setup, advanced, wind, terrain }, null, 2))
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
        <h2>Flugparabel <InfoHint text="Hauptrechner fuer Trajektorie, Kennwerte, Wind, Drift, Zeroing und Terrainanalyse des aktuell aktiven Setups." /></h2>
        <p>Hauptrechner fuer Trajektorie, Kennwerte, Wind, Zeroing, Terrain und zusaetzliche Analysekurven.</p>
        <div className="hero-meta">
          <span>Idee: Guido Zauta</span>
          <span>Umsetzung: Patrick Zauta</span>
          <span>Aktiver Pfeil: {arrowBuilds.find((build) => build.id === activeArrowBuildId)?.name ?? "Kein Profil"}</span>
        </div>
      </header>

      <section className="dashboard-strip">
        <article className="dashboard-stat"><span className="dashboard-label">Aktives Preset</span><strong>{presets.find((preset) => preset.id === activePresetId)?.name ?? "Kein Preset"}</strong></article>
        <article className="dashboard-stat"><span className="dashboard-label">Simulation</span><strong>{advanced.simulationMode === "physics" ? "Physik sauber" : "Referenzmodus"}</strong></article>
        <article className="dashboard-stat"><span className="dashboard-label">Geschwindigkeit</span><strong>{speedDisplayValue.toFixed(1)} {speedUnit}</strong></article>
        <article className="dashboard-stat"><span className="dashboard-label">Gewicht</span><strong>{setup.m_grain.toFixed(1)} grain</strong></article>
      </section>

      <section className="card quick-actions accent-card accent-primary">
        <button type="button" onClick={() => applyPreset(activePresetId)}>Reset auf Preset</button>
        <button type="button" onClick={copyValues}>Copy Werte</button>
        <button type="button" onClick={savePreset}>Save Preset</button>
        <button type="button" className={performanceMode ? "active" : ""} onClick={() => setPerformanceMode(!performanceMode)}>Performance Mode</button>
        <div className="unit-switch">
          <button type="button" className={heightDisplayUnit === "cm" ? "active" : ""} onClick={() => setHeightDisplayUnit("cm")}>Hoehe in cm</button>
          <button type="button" className={heightDisplayUnit === "m" ? "active" : ""} onClick={() => setHeightDisplayUnit("m")}>Hoehe in m</button>
        </div>
      </section>

      <div className="layout-grid">
        <section className="card panel-lift">
          <h3>Preset <InfoHint text="Hier wechselst du zwischen gespeicherten Presets und aktiven Pfeilprofilen. Beide wirken sofort global in der App." /></h3>
          <label className="field">
            <span>Auswahl</span>
            <select value={activePresetId} onChange={(event) => applyPreset(event.target.value)}>
              {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Aktiver Pfeil</span>
            <select value={activeArrowBuildId} onChange={(event) => applyArrowBuild(event.target.value)}>
              {arrowBuilds.map((build) => <option key={build.id} value={build.id}>{build.name}</option>)}
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

      <section className="card accent-card accent-primary">
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Einschiess-Distanz (m) <InfoHint text="Der Solver berechnet den noetigen Winkel fuer diese Distanz und Zielhoehe." /></span>
            <input type="number" value={zeroDistanceM} onChange={(event) => setZeroDistanceM(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Zielhoehe (cm)</span>
            <input type="number" value={zeroTargetHeightCm} onChange={(event) => setZeroTargetHeightCm(Number(event.target.value) || 0)} />
          </label>
        </div>
        <div className="result-grid">
          <article className="card"><h3>Zeroing</h3><p>{zeroingResult.angle_deg.toFixed(3)} deg</p><small>Fehler {zeroingResult.error_m.toFixed(4)} m</small></article>
          <article className="card"><h3>Aktion</h3><button type="button" onClick={() => updateSetup({ angle_deg: zeroingResult.angle_deg })}>Zero-Winkel uebernehmen</button></article>
        </div>
      </section>

      <section className="card accent-card accent-cyan">
        <div className="table-header">
          <div>
            <h3>Wind und Seitenabweichung <InfoHint text="Ruecken- und Gegenwind beeinflussen die Reichweite. Seitenwind erzeugt eine laterale Abweichung auf der z-Achse." /></h3>
            <p>Ruecken- und Gegenwind beeinflussen die Reichweite. Seitenwind erzeugt zusaetzlich einen lateralen Drift.</p>
          </div>
          <div className="hero-meta">
            <span>Reichweiten-Effekt: {rangeDeltaM >= 0 ? "+" : ""}{rangeDeltaM.toFixed(2)} m</span>
            <span>Seitlicher Versatz: {formatVerticalValue(driftAtTargetCm / 100, heightDisplayUnit)}</span>
          </div>
        </div>
        <div className="inline-grid">
          <label className="field-inline"><input type="checkbox" checked={wind.enabled} onChange={(event) => updateWind({ enabled: event.target.checked })} /> Wind aktiv</label>
          <label className="field"><span>Windgeschwindigkeit (m/s)</span><input type="number" value={wind.windSpeed_mps} step={0.1} onChange={(event) => updateWind({ windSpeed_mps: Number(event.target.value) || 0 })} /></label>
          <label className="field"><span>Windrichtung (deg)</span><input type="number" value={wind.windDirection_deg} step={1} onChange={(event) => updateWind({ windDirection_deg: Number(event.target.value) || 0 })} /></label>
          <label className="field"><span>Ziel Distanz fuer Drift (m)</span><input type="number" value={driftDistanceM} step={1} onChange={(event) => setDriftDistanceM(Number(event.target.value) || 0)} /></label>
        </div>
        <p>Drift bei {driftDistanceM.toFixed(1)} m: {formatVerticalValue(driftAtTargetCm / 100, heightDisplayUnit)}</p>
        {driftSeries.length > 1 && (
          <div className="chart-wrapper mini-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={driftSeries} margin={{ top: 12, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="xM" type="number" domain={[0, "dataMax"]} tickFormatter={(value) => Number(value).toFixed(0)} />
                <YAxis tickFormatter={(value) => metersToHeightUnit(Number(value), heightDisplayUnit).toFixed(1)} />
                <Tooltip formatter={(value: number) => `${metersToHeightUnit(value, heightDisplayUnit).toFixed(2)} ${formatHeightUnitLabel(heightDisplayUnit)}`} labelFormatter={(value) => `Distanz ${Number(value).toFixed(2)} m`} />
                <Line type="monotone" dataKey="zM" name="Seitlicher Drift" stroke="#22d3ee" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card accent-card accent-amber">
        <div className="table-header">
          <div>
            <h3>Terrain Profil <InfoHint text="Ein lineares Gelaendeprofil mit Steigung und Offset. Die App erkennt den ersten Schnittpunkt zwischen Flugbahn und Gelaende." /></h3>
            <p>Einfaches lineares Profil fuer bergauf, bergab oder versetzte Zielhoehen.</p>
          </div>
          <div className="hero-meta">
            <span>Impact: {terrainImpact ? `${terrainImpact.xM.toFixed(2)} m` : "kein Terrain-Hit"}</span>
            <span>Terrain bei 50 m: {terrainHeightAtDistance(terrain, 50).toFixed(2)} m</span>
          </div>
        </div>
        <div className="layout-grid compact-grid">
          <label className="field-inline"><input type="checkbox" checked={terrain.enabled} onChange={(event) => updateTerrain({ enabled: event.target.checked })} /> Terrain aktiv</label>
          <label className="field"><span>Steigung (deg)</span><input type="number" value={terrain.slope_deg} onChange={(event) => updateTerrain({ slope_deg: Number(event.target.value) || 0 })} /></label>
          <label className="field"><span>Offset (m)</span><input type="number" value={terrain.offset_m} onChange={(event) => updateTerrain({ offset_m: Number(event.target.value) || 0 })} /></label>
        </div>
        {terrainSeries.length > 1 && (
          <div className="chart-wrapper mini-chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={terrainSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="xM" tickFormatter={(value) => Number(value).toFixed(0)} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="trajectoryY" name="Flugbahn" stroke="#4f46e5" dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="terrainY" name="Terrain" stroke="#f59e0b" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {(validation.excelWarnings.length > 0 || dtSteps > 30000) && (
        <section className="warning">
          <strong>Hinweis: ausserhalb Referenzbereich.</strong>
          <ul>
            {validation.excelWarnings.map((warning) => <li key={warning}>{warning}</li>)}
            {dtSteps > 30000 && <li>dt erzeugt {dtSteps.toLocaleString()} Schritte. Fuer bessere UI-Performance Performance Mode aktivieren.</li>}
          </ul>
        </section>
      )}

      {validation.errors.length > 0 && (
        <section className="error">
          <strong>Validierungsfehler:</strong>
          <ul>{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </section>
      )}

      {simulation && (
        <>
          <MetricsCards nullDistanceM={simulation.nullDistanceM} apexDistanceM={simulation.apexDistanceM} apexHeightM={simulation.apexHeightM} heightUnit={heightDisplayUnit} />

          <TrajectoryChart data={chartSeries} rangeMode={curveRangeMode} heightUnit={heightDisplayUnit} onToggleRange={() => setCurveRangeMode((current) => (current === "apex" ? "zero" : "apex"))} />

          <section className="card">
            <div className="table-header">
              <div>
                <h3>Kennkurven <InfoHint text="Zusatzdiagramm fuer Geschwindigkeit, Energie, Impuls, Drift oder Hoehe ueber Distanz." /></h3>
              </div>
              <label className="field">
                <span>Diagramm</span>
                <select value={chartMetric} onChange={(event) => setChartMetric(event.target.value as typeof chartMetric)}>
                  <option value="height">Hoehe</option>
                  <option value="speed">Geschwindigkeit</option>
                  <option value="energy">Energie</option>
                  <option value="impulse">Impuls</option>
                  <option value="drift">Drift</option>
                </select>
              </label>
            </div>
            <div className="chart-wrapper mini-chart">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={metricSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="xM" tickFormatter={(value) => Number(value).toFixed(0)} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <SupportPointsTable points={supportPoints} heightUnit={heightDisplayUnit} onExportCsv={() => triggerCsvDownload("flugkurve-stuetzpunkte.csv", supportPointsToCsv(supportPoints))} />
        </>
      )}

      <section className="card accent-card accent-amber">
        <div className="table-header">
          <div>
            <h3>Kalibrierung als separater Modus <InfoHint text="Testschuesse werden in einem eigenen Arbeitsbereich erfasst und erst nach Pruefung in das aktive Setup uebernommen." /></h3>
            <p>Testschuesse werden jetzt in einem eigenen Arbeitsbereich erfasst, geprueft und erst danach in das aktive Setup uebernommen.</p>
          </div>
          <Link to="/calibration" className="tab-link active">Zur Kalibrierung</Link>
        </div>
      </section>
    </main>
  )
}
