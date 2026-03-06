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
import { Link } from "react-router-dom"
import { InfoHint } from "../components/InfoHint"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { filterCurvePoints, findApproxPointAtDistance, simulateBallistics } from "../lib/ballistics"
import { calibrateFromMeasurement, type CalibrationResult, type CalibrationTarget } from "../lib/calibration"
import { toAdvancedSettings, toUserInputs, toWindOptions } from "../lib/simulationAdapters"
import type { AdvancedParams, HeightDisplayUnit, Preset } from "../lib/types"
import { formatHeightUnitLabel, metersToHeightUnit } from "../lib/units"
import { useAppStore } from "../store/useAppStore"

interface CalibrationShot {
  id: string
  label: string
  measuredDistance_m: number
  measuredDrop_cm: number
}

interface CalibrationPreview {
  result: CalibrationResult
  calibratedAdvanced: AdvancedParams
  chartData: Array<{ xM: number; beforeY: number; afterY: number; targetY: number }>
}

function buildShot(): CalibrationShot {
  return {
    id: `shot-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    label: "Testschuss",
    measuredDistance_m: 30,
    measuredDrop_cm: 25,
  }
}

function buildCalibrationChartData(
  beforePoints: ReturnType<typeof simulateBallistics>["points"],
  afterPoints: ReturnType<typeof simulateBallistics>["points"],
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
      beforeY: findApproxPointAtDistance(beforePoints, xM).yM,
      afterY: findApproxPointAtDistance(afterPoints, xM).yM,
      targetY: targetY_m,
    })
  }

  return rows
}

function formatVerticalValue(valueM: number, unit: HeightDisplayUnit): string {
  return `${metersToHeightUnit(valueM, unit).toFixed(2)} ${formatHeightUnitLabel(unit)}`
}

export function CalibrationPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const heightDisplayUnit = useAppStore((state) => state.heightDisplayUnit)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)
  const upsertPreset = useAppStore((state) => state.upsertPreset)

  const [shots, setShots] = useState<CalibrationShot[]>([
    { id: "shot-a", label: "Testschuss A", measuredDistance_m: 30, measuredDrop_cm: 25 },
  ])
  const [selectedShotId, setSelectedShotId] = useState("shot-a")
  const [calTarget, setCalTarget] = useState<CalibrationTarget>("cw")
  const [calSignMode, setCalSignMode] = useState<"auto-negative" | "manual">("auto-negative")
  const [calManualSign, setCalManualSign] = useState<1 | -1>(-1)
  const [preview, setPreview] = useState<CalibrationPreview | null>(null)

  const debouncedShots = useDebouncedValue(shots, 150)
  const selectedShot = useMemo(
    () => debouncedShots.find((shot) => shot.id === selectedShotId) ?? debouncedShots[0] ?? null,
    [debouncedShots, selectedShotId],
  )

  const currentSimulation = useMemo(
    () => simulateBallistics(toUserInputs(setup), toAdvancedSettings(advanced), toWindOptions(wind)),
    [advanced, setup, wind],
  )

  const addShot = () => {
    const shot = buildShot()
    setShots((current) => [...current, shot])
    setSelectedShotId(shot.id)
  }

  const updateShot = (id: string, patch: Partial<CalibrationShot>) => {
    setShots((current) => current.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot)))
  }

  const removeShot = (id: string) => {
    setShots((current) => {
      const next = current.filter((shot) => shot.id !== id)
      if (selectedShotId === id && next[0]) {
        setSelectedShotId(next[0].id)
      }
      return next.length > 0 ? next : current
    })
  }

  const runCalibration = () => {
    if (!selectedShot) {
      return
    }

    const result = calibrateFromMeasurement({
      setup,
      advanced,
      wind,
      measuredDistance_m: selectedShot.measuredDistance_m,
      measuredDrop_cm: selectedShot.measuredDrop_cm,
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

    setPreview({
      result,
      calibratedAdvanced,
      chartData: buildCalibrationChartData(
        filterCurvePoints(currentSimulation.points, Math.max(selectedShot.measuredDistance_m * 1.2, currentSimulation.nullDistanceM)),
        filterCurvePoints(calibratedSimulation.points, Math.max(selectedShot.measuredDistance_m * 1.2, calibratedSimulation.nullDistanceM)),
        result.targetY_m,
        selectedShot.measuredDistance_m,
      ),
    })
  }

  const applyCalibration = () => {
    if (!preview) {
      return
    }

    updateAdvanced(preview.calibratedAdvanced)
  }

  const saveCalibratedPreset = () => {
    if (!preview) {
      return
    }

    const name = window.prompt("Preset Name fuer das kalibrierte Setup")
    if (!name) {
      return
    }

    const preset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      setup: { ...setup },
      advanced: { ...preview.calibratedAdvanced },
      wind: { ...wind },
      isSystem: false,
    }

    upsertPreset(preset)
    window.alert("Kalibriertes Preset gespeichert")
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Kalibrierung</h2>
        <p>Separater Modus fuer Testschuesse. Trage Distanz und gemessenen Drop ein, pruefe die Vorschau und uebernimm danach die Kalibrierung in dein aktives Setup.</p>
        <div className="hero-meta">
          <span>Aktives Setup wird verwendet</span>
          <span>Mehrere Testschuesse moeglich</span>
          <span>Ergebnis als Preset speicherbar</span>
        </div>
      </header>

      <section className="dashboard-strip">
        <article className="dashboard-stat">
          <span className="dashboard-label">Arbeitsweise <InfoHint text="Dieser Modus ist bewusst getrennt von der Flugparabel. Erst Testschuesse eintragen, dann die beste Kalibrierung pruefen und danach uebernehmen." /></span>
          <strong>Testschuesse zuerst</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Aktiver Satz <InfoHint text="Kalibriert werden immer die aktuellen Setup-, Wind- und Advanced-Werte aus dem globalen App-State." /></span>
          <strong>{setup.v_fps.toFixed(1)} fps | {setup.m_grain.toFixed(1)} grain</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Rueckweg <InfoHint text="Nach dem Anwenden ist die neue Kurve sofort in der Flugparabel sichtbar." /></span>
          <strong><Link to="/flight">Zur Flugparabel</Link></strong>
        </article>
      </section>

      <section className="card accent-card accent-primary">
        <div className="table-header">
          <div>
            <h3>Testschuesse</h3>
            <p>Mehrere Messungen erfassen und einen Eintrag als Kalibrierreferenz auswaehlen.</p>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={addShot}>Testschuss hinzufügen</button>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Aktiv</th>
                <th>Bezeichnung</th>
                <th>Distanz (m)</th>
                <th>Drop (cm)</th>
                <th>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {shots.map((shot) => (
                <tr key={shot.id}>
                  <td>
                    <input
                      type="radio"
                      name="calibration-shot"
                      checked={selectedShotId === shot.id}
                      onChange={() => setSelectedShotId(shot.id)}
                    />
                  </td>
                  <td>
                    <input value={shot.label} onChange={(event) => updateShot(shot.id, { label: event.target.value })} />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={shot.measuredDistance_m}
                      onChange={(event) => updateShot(shot.id, { measuredDistance_m: Number(event.target.value) || 0 })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={shot.measuredDrop_cm}
                      onChange={(event) => updateShot(shot.id, { measuredDrop_cm: Number(event.target.value) || 0 })}
                    />
                  </td>
                  <td>
                    <button type="button" onClick={() => removeShot(shot.id)} disabled={shots.length === 1}>
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card accent-card accent-cyan">
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Kalibrierziel <InfoHint text="Cw passt den Widerstandsbeiwert an. k kalibriert direkt den bereits abgeleiteten Drag-Term." /></span>
            <select value={calTarget} onChange={(event) => setCalTarget(event.target.value as CalibrationTarget)}>
              <option value="cw">Kalibriere Cw</option>
              <option value="k">Kalibriere k direkt</option>
            </select>
          </label>
          <label className="field">
            <span>Drop Interpretation <InfoHint text="Standard ist negativer Drop relativ zur Startlinie. Bei Sonderfaellen kann das Vorzeichen manuell gewaehlt werden." /></span>
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
          <button type="button" onClick={runCalibration} disabled={!selectedShot}>Kalibrierung berechnen</button>
          <button type="button" onClick={applyCalibration} disabled={!preview}>Kalibrierung anwenden</button>
          <button type="button" onClick={saveCalibratedPreset} disabled={!preview}>Als Preset speichern</button>
        </div>
      </section>

      {preview && selectedShot && (
        <section className="stack">
          <div className="result-grid">
            <article className="card">
              <h3>Referenz</h3>
              <p>{selectedShot.label}</p>
              <small>{selectedShot.measuredDistance_m.toFixed(1)} m | {selectedShot.measuredDrop_cm.toFixed(1)} cm Drop</small>
            </article>
            <article className="card">
              <h3>Vorher</h3>
              <p>{preview.result.previousValue.toFixed(5)}</p>
              <small>Fehler: {preview.result.errorBefore_m.toFixed(4)} m</small>
            </article>
            <article className="card">
              <h3>Nachher</h3>
              <p>{preview.result.calibratedValue.toFixed(5)}</p>
              <small>Fehler: {preview.result.errorAfter_m.toFixed(4)} m</small>
            </article>
            <article className="card">
              <h3>Zielwert</h3>
              <p>{formatVerticalValue(preview.result.targetY_m, heightDisplayUnit)}</p>
              <small>{preview.result.usedSignSwitch ? "Vorzeichenwechsel erkannt" : "Best-Fit ohne Vorzeichenwechsel"}</small>
            </article>
          </div>

          <section className="card accent-card accent-amber">
            <h3>Vorher/Nachher Vorschau</h3>
            <div className="chart-wrapper mini-chart">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={preview.chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="xM" tickFormatter={(value) => Number(value).toFixed(0)} />
                  <YAxis tickFormatter={(value) => metersToHeightUnit(Number(value), heightDisplayUnit).toFixed(1)} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${metersToHeightUnit(value, heightDisplayUnit).toFixed(2)} ${formatHeightUnitLabel(heightDisplayUnit)}`,
                      name,
                    ]}
                    labelFormatter={(value) => `Distanz ${Number(value).toFixed(2)} m`}
                  />
                  <Legend />
                  <ReferenceLine x={selectedShot.measuredDistance_m} stroke="#f59e0b" strokeDasharray="4 4" label="Testschuss" />
                  <Line type="monotone" dataKey="beforeY" name="Vorher" stroke="#64748b" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="afterY" name="Nachher" stroke="#10b981" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="targetY" name="Messziel" stroke="#f59e0b" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </section>
      )}
    </main>
  )
}
