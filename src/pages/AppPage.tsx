import { useMemo } from "react"
import { AngleControl } from "../components/AngleControl"
import { ArrowInputs } from "../components/ArrowInputs"
import { AdvancedSettingsPanel } from "../components/AdvancedSettingsPanel"
import { InfoSection } from "../components/InfoSection"
import { MetricsCards } from "../components/MetricsCards"
import { PresetSwitcher } from "../components/PresetSwitcher"
import { SupportPointsTable } from "../components/SupportPointsTable"
import { TrajectoryChart } from "../components/TrajectoryChart"
import type { TrajectoryChartPoint } from "../components/TrajectoryChart"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { buildSupportPoints, filterCurvePoints, simulateBallistics } from "../lib/ballistics"
import { DEFAULT_ADVANCED_SETTINGS, EXTENDED_LIMITS } from "../lib/constants"
import { supportPointsToCsv } from "../lib/csv"
import { DEFAULT_PRESET_ID, getPresetById, getPresetSpeedForUnit, PRESETS } from "../lib/presets"
import { fpsToMps, mpsToFps } from "../lib/units"
import { clampToRange, validateInputs } from "../lib/validation"
import type {
  AdvancedSettings,
  AngleInputMode,
  CurveRangeMode,
  PresetId,
  SpeedUnit,
  UserInputs,
} from "../types/ballistics"

interface FormState {
  presetId: PresetId
  speedUnit: SpeedUnit
  speedValue: number
  diameterMm: number
  weightGrain: number
  angleDeg: number
  angleMode: AngleInputMode
  fineStep: 0.1 | 0.01
  curveRangeMode: CurveRangeMode
  advanced: AdvancedSettings
}

function buildDefaultFormState(): FormState {
  const preset = getPresetById(DEFAULT_PRESET_ID)

  return {
    presetId: preset.id,
    speedUnit: "fps",
    speedValue: preset.speedFps,
    diameterMm: preset.diameterMm,
    weightGrain: preset.weightGrain,
    angleDeg: preset.angleDeg,
    angleMode: "direct",
    fineStep: 0.1,
    curveRangeMode: "apex",
    advanced: DEFAULT_ADVANCED_SETTINGS,
  }
}

function getSpeedRangeForUnit(unit: SpeedUnit): { min: number; max: number } {
  if (unit === "fps") {
    return EXTENDED_LIMITS.speedFps
  }

  return {
    min: fpsToMps(EXTENDED_LIMITS.speedFps.min),
    max: fpsToMps(EXTENDED_LIMITS.speedFps.max),
  }
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

function sanitizeNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return value
}

export function AppPage() {
  const [formState, setFormState] = useLocalStorage<FormState>("arrow-calc-state", buildDefaultFormState())

  const speedRange = useMemo(() => getSpeedRangeForUnit(formState.speedUnit), [formState.speedUnit])

  const debouncedForm = useDebouncedValue(formState, 150)

  const debouncedInputs: UserInputs = {
    speedValue: debouncedForm.speedValue,
    speedUnit: debouncedForm.speedUnit,
    diameterMm: debouncedForm.diameterMm,
    weightGrain: debouncedForm.weightGrain,
    angleDeg: debouncedForm.angleDeg,
  }

  const validation = useMemo(
    () => validateInputs(debouncedInputs, debouncedForm.advanced),
    [debouncedForm.advanced, debouncedInputs],
  )

  const simulation = useMemo(() => {
    if (validation.errors.length > 0) {
      return null
    }

    return simulateBallistics(debouncedInputs, debouncedForm.advanced)
  }, [debouncedForm.advanced, debouncedInputs, validation.errors.length])

  const visibleEndDistanceM = useMemo(() => {
    if (!simulation) {
      return 0
    }

    return formState.curveRangeMode === "apex" ? simulation.apexDistanceM : simulation.nullDistanceM
  }, [formState.curveRangeMode, simulation])

  const visiblePoints = useMemo(() => {
    if (!simulation) {
      return []
    }

    return filterCurvePoints(simulation.points, visibleEndDistanceM)
  }, [simulation, visibleEndDistanceM])

  const chartSeries = useMemo<TrajectoryChartPoint[]>(() => {
    if (!simulation) {
      return []
    }

    return visiblePoints
      .filter(
        (point) =>
          Number.isFinite(point.xM) &&
          Number.isFinite(point.yM) &&
          Number.isFinite(point.vxMs) &&
          Number.isFinite(point.vyMs) &&
          Number.isFinite(point.timeSec),
      )
      .map((point) => {
        const speedMs = Math.sqrt(point.vxMs * point.vxMs + point.vyMs * point.vyMs)
        const kineticEnergyJ = 0.5 * simulation.derived.massKg * speedMs * speedMs

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
  }, [simulation, visiblePoints])

  const supportPoints = useMemo(() => {
    if (!simulation) {
      return []
    }

    return buildSupportPoints(simulation.points, visibleEndDistanceM, 2)
  }, [simulation, visibleEndDistanceM])

  const setPreset = (presetId: PresetId) => {
    const preset = getPresetById(presetId)

    setFormState((current) => ({
      ...current,
      presetId,
      speedValue: Number(getPresetSpeedForUnit(preset.speedFps, current.speedUnit).toFixed(3)),
      diameterMm: preset.diameterMm,
      weightGrain: preset.weightGrain,
      angleDeg: preset.angleDeg,
      angleMode: "direct",
    }))
  }

  const setSpeedUnit = (unit: SpeedUnit) => {
    setFormState((current) => {
      if (current.speedUnit === unit) {
        return current
      }

      const speedMs = current.speedUnit === "fps" ? fpsToMps(current.speedValue) : current.speedValue
      const converted = unit === "fps" ? mpsToFps(speedMs) : speedMs
      const nextRange = getSpeedRangeForUnit(unit)

      return {
        ...current,
        speedUnit: unit,
        speedValue: Number(clampToRange(converted, nextRange).toFixed(3)),
      }
    })
  }

  const setSpeedValue = (value: number) => {
    setFormState((current) => ({
      ...current,
      speedValue: Number(
        clampToRange(
          sanitizeNumber(value, current.speedValue),
          getSpeedRangeForUnit(current.speedUnit),
        ).toFixed(3),
      ),
    }))
  }

  const setDiameter = (value: number) => {
    setFormState((current) => ({
      ...current,
      diameterMm: Number(
        clampToRange(sanitizeNumber(value, current.diameterMm), EXTENDED_LIMITS.diameterMm).toFixed(3),
      ),
    }))
  }

  const setWeight = (value: number) => {
    setFormState((current) => ({
      ...current,
      weightGrain: Number(Math.max(EXTENDED_LIMITS.weightGrain.min, sanitizeNumber(value, current.weightGrain)).toFixed(3)),
    }))
  }

  const setAngle = (value: number) => {
    setFormState((current) => ({
      ...current,
      angleDeg: Number(
        clampToRange(sanitizeNumber(value, current.angleDeg), EXTENDED_LIMITS.angleDeg).toFixed(3),
      ),
    }))
  }

  const setAngleMode = (mode: AngleInputMode) => {
    setFormState((current) => ({
      ...current,
      angleMode: mode,
    }))
  }

  const setFineStep = (step: 0.1 | 0.01) => {
    setFormState((current) => ({
      ...current,
      fineStep: step,
    }))
  }

  const setAdvanced = (nextAdvanced: AdvancedSettings) => {
    setFormState((current) => ({
      ...current,
      advanced: {
        ...nextAdvanced,
        cw: sanitizeNumber(nextAdvanced.cw, current.advanced.cw),
        g: sanitizeNumber(nextAdvanced.g, current.advanced.g),
        rho: sanitizeNumber(nextAdvanced.rho, current.advanced.rho),
        dt: Number(
          clampToRange(sanitizeNumber(nextAdvanced.dt, current.advanced.dt), EXTENDED_LIMITS.dt).toFixed(5),
        ),
        maxTimeSec: Number(
          clampToRange(
            sanitizeNumber(nextAdvanced.maxTimeSec, current.advanced.maxTimeSec),
            EXTENDED_LIMITS.maxTimeSec,
          ).toFixed(3),
        ),
      },
    }))
  }

  const toggleCurveRange = () => {
    setFormState((current) => ({
      ...current,
      curveRangeMode: current.curveRangeMode === "apex" ? "zero" : "apex",
    }))
  }

  const exportCsv = () => {
    const csv = supportPointsToCsv(supportPoints)
    triggerCsvDownload("flugkurve-stuetzpunkte.csv", csv)
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>Pfeilflug Kalkulator</h1>
        <p>Eigenstaendige Ballistik-App fuer Flugkurve, Kennwerte und dynamische Trajektorienanalyse.</p>
        <div className="hero-meta">
          <span>SPA</span>
          <span>React + TypeScript</span>
          <span>GitHub Pages Ready</span>
        </div>
      </header>

      <div className="layout-grid">
        <PresetSwitcher presets={PRESETS} selectedPresetId={formState.presetId} onSelect={setPreset} />

        <ArrowInputs
          speedValue={formState.speedValue}
          speedUnit={formState.speedUnit}
          speedMin={speedRange.min}
          speedMax={speedRange.max}
          diameterMm={formState.diameterMm}
          weightGrain={formState.weightGrain}
          onSpeedValueChange={setSpeedValue}
          onSpeedUnitChange={setSpeedUnit}
          onDiameterChange={setDiameter}
          onWeightChange={setWeight}
        />

        <AngleControl
          angleDeg={formState.angleDeg}
          mode={formState.angleMode}
          fineStep={formState.fineStep}
          onModeChange={setAngleMode}
          onAngleChange={setAngle}
          onFineStepChange={setFineStep}
        />

        <AdvancedSettingsPanel settings={formState.advanced} onSettingsChange={setAdvanced} />
      </div>

      {validation.excelWarnings.length > 0 && (
        <section className="warning">
          <strong>Hinweis: ausserhalb Referenzbereich.</strong>
          <ul>
            {validation.excelWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
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

          <TrajectoryChart data={chartSeries} rangeMode={formState.curveRangeMode} onToggleRange={toggleCurveRange} />

          <SupportPointsTable points={supportPoints} onExportCsv={exportCsv} />

          <section className="card formula-note">
            <h2>Datenreihen Kernwerte</h2>
            <p>
              v(ms): {simulation.derived.speedMs.toFixed(4)} | m(kg): {simulation.derived.massKg.toFixed(6)} |
              A(m^2): {simulation.derived.areaM2.toExponential(6)} | k(1/m): {simulation.derived.dragFactorK.toFixed(8)}
            </p>
          </section>
        </>
      )}

      <InfoSection />

      <footer className="site-footer">Copyright by Zauta</footer>
    </main>
  )
}
