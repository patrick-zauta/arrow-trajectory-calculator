import { useMemo, useState } from "react"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { DEFAULT_EFFICIENCY_BY_BOW, estimateArrowSpeed, type BowType } from "../lib/setupEstimator"
import { useAppStore } from "../store/useAppStore"

export function SetupPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const updateSetup = useAppStore((state) => state.updateSetup)

  const [bowType, setBowType] = useState<BowType>("Compound")
  const [drawWeight_lbs, setDrawWeight] = useState(60)
  const [drawLength_in, setDrawLength] = useState(29)
  const [iboSpeed_fps, setIboSpeed] = useState<string>("")
  const [efficiencyFactor, setEfficiency] = useState(DEFAULT_EFFICIENCY_BY_BOW.Compound)
  const [arrowMass_grain, setArrowMass] = useState(setup.m_grain)
  const [extraMass_grain, setExtraMass] = useState(0)

  const debounced = useDebouncedValue(
    {
      bowType,
      drawWeight_lbs,
      drawLength_in,
      iboSpeed_fps,
      efficiencyFactor,
      arrowMass_grain,
      extraMass_grain,
    },
    150,
  )

  const result = useMemo(
    () =>
      estimateArrowSpeed({
        bowType: debounced.bowType,
        drawWeight_lbs: debounced.drawWeight_lbs,
        drawLength_in: debounced.drawLength_in,
        iboSpeed_fps: debounced.iboSpeed_fps === "" ? null : Number(debounced.iboSpeed_fps),
        efficiencyFactor: debounced.efficiencyFactor,
        arrowMass_grain: debounced.arrowMass_grain,
        extraMass_grain: debounced.extraMass_grain,
      }),
    [debounced],
  )

  const isExtreme = result.speed_fps > 450 || result.speed_fps < 80

  return (
    <main className="page">
      <header className="hero">
        <h2>Setup Rechner</h2>
        <p>Geschaetzte Startgeschwindigkeit aus Bogenparametern. Nur Schätzung.</p>
      </header>

      <section className="card">
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Bogentyp</span>
            <select
              value={bowType}
              onChange={(event) => {
                const next = event.target.value as BowType
                setBowType(next)
                setEfficiency(DEFAULT_EFFICIENCY_BY_BOW[next])
              }}
            >
              <option>Compound</option>
              <option>Recurve</option>
              <option>Langbogen</option>
            </select>
          </label>
          <label className="field">
            <span>Draw Weight (lbs)</span>
            <input type="number" value={drawWeight_lbs} onChange={(event) => setDrawWeight(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Draw Length (in)</span>
            <input type="number" value={drawLength_in} onChange={(event) => setDrawLength(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>IBO Speed (fps, optional)</span>
            <input value={iboSpeed_fps} onChange={(event) => setIboSpeed(event.target.value)} />
          </label>
          <label className="field">
            <span>Effizienzfaktor</span>
            <input type="number" value={efficiencyFactor} step={0.01} onChange={(event) => setEfficiency(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Pfeilmasse (grain)</span>
            <input type="number" value={arrowMass_grain} onChange={(event) => setArrowMass(Number(event.target.value) || 0)} />
          </label>
          <label className="field">
            <span>Extra Masse (grain)</span>
            <input type="number" value={extraMass_grain} onChange={(event) => setExtraMass(Number(event.target.value) || 0)} />
          </label>
        </div>

        <div className="inline-actions">
          <button type="button" onClick={() => updateSetup({ v_fps: result.speed_fps })}>Geschwindigkeit uebernehmen</button>
          <button type="button" onClick={() => setArrowMass(setup.m_grain)}>Grain aus Active Setup uebernehmen</button>
        </div>
      </section>

      <section className="result-grid">
        <article className="card">
          <h3>Speed</h3>
          <p>{result.speed_fps.toFixed(2)} fps</p>
          <small>{result.speed_ms.toFixed(2)} m/s</small>
        </article>
        <article className="card">
          <h3>Energie</h3>
          <p>{result.energy_J.toFixed(2)} J</p>
          <small>Impuls {result.impulse_Ns.toFixed(4)} Ns</small>
        </article>
      </section>

      {isExtreme && <section className="warning"><strong>Warnung:</strong> Ergebnis liegt in einem extremen Bereich.</section>}
    </main>
  )
}