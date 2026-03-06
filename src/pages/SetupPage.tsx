import { useMemo, useState } from "react"
import { DraftNumberInput } from "../components/DraftNumberInput"
import { InfoHint } from "../components/InfoHint"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { computeChronoStats } from "../lib/chrono"
import { DEFAULT_EFFICIENCY_BY_BOW, estimateArrowSpeed, type BowType } from "../lib/setupEstimator"
import type { ChronoSession } from "../lib/types"
import { useAppStore } from "../store/useAppStore"

function buildChronoSession(entries: number[]): ChronoSession {
  return {
    id: `chrono-${Date.now()}`,
    name: `Chrono ${new Date().toLocaleDateString("de-CH")}`,
    createdAt: new Date().toISOString(),
    entries: entries.map((value, index) => ({ id: `entry-${index}`, label: `Shot ${index + 1}`, speed_fps: value })),
  }
}

export function SetupPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const chronoSessions = useAppStore((state) => state.chronoSessions)
  const updateSetup = useAppStore((state) => state.updateSetup)
  const upsertChronoSession = useAppStore((state) => state.upsertChronoSession)
  const removeChronoSession = useAppStore((state) => state.removeChronoSession)

  const [bowType, setBowType] = useState<BowType>("Compound")
  const [drawWeight_lbs, setDrawWeight] = useState(60)
  const [drawLength_in, setDrawLength] = useState(29)
  const [iboSpeed_fps, setIboSpeed] = useState<string>("")
  const [efficiencyFactor, setEfficiency] = useState(DEFAULT_EFFICIENCY_BY_BOW.Compound)
  const [arrowMass_grain, setArrowMass] = useState(setup.m_grain)
  const [extraMass_grain, setExtraMass] = useState(0)
  const [chronoInput, setChronoInput] = useState("148,151,149,150")

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

  const chronoValues = useMemo(
    () => chronoInput.split(",").map((entry) => Number(entry.trim())).filter((entry) => Number.isFinite(entry) && entry > 0),
    [chronoInput],
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

  const chronoStats = useMemo(() => computeChronoStats(buildChronoSession(chronoValues).entries), [chronoValues])
  const isExtreme = result.speed_fps > 450 || result.speed_fps < 80

  return (
    <main className="page">
      <header className="hero">
        <h2>
          Setup Rechner{" "}
          <InfoHint text="Dieser Rechner schaetzt die Startgeschwindigkeit aus Bogenparametern und bietet einen Chronograph-Abgleich mit Mittelwertbildung." />
        </h2>
        <p>Geschaetzte Startgeschwindigkeit aus Bogenparametern, nur als Schaetzung. Gemessene Chrono-Werte koennen direkt gegengeprueft und uebernommen werden.</p>
      </header>

      <section className="card">
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Bogentyp <InfoHint text="Der Bogentyp setzt sinnvolle Standardwerte fuer den Effizienzfaktor." /></span>
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
            <DraftNumberInput value={drawWeight_lbs} onCommit={(next) => setDrawWeight(next ?? drawWeight_lbs)} />
          </label>
          <label className="field">
            <span>Draw Length (in)</span>
            <DraftNumberInput value={drawLength_in} onCommit={(next) => setDrawLength(next ?? drawLength_in)} />
          </label>
          <label className="field">
            <span>IBO Speed (fps, optional)</span>
            <input value={iboSpeed_fps} onChange={(event) => setIboSpeed(event.target.value)} />
          </label>
          <label className="field">
            <span>Effizienzfaktor</span>
            <DraftNumberInput value={efficiencyFactor} onCommit={(next) => setEfficiency(next ?? efficiencyFactor)} step={0.01} />
          </label>
          <label className="field">
            <span>Pfeilmasse (grain)</span>
            <DraftNumberInput value={arrowMass_grain} onCommit={(next) => setArrowMass(next ?? arrowMass_grain)} />
          </label>
          <label className="field">
            <span>Extra Masse (grain)</span>
            <DraftNumberInput value={extraMass_grain} onCommit={(next) => setExtraMass(next ?? extraMass_grain)} />
          </label>
        </div>

        <div className="inline-actions">
          <button type="button" onClick={() => updateSetup({ v_fps: result.speed_fps })}>Geschaetzte Geschwindigkeit uebernehmen</button>
          <button type="button" onClick={() => setArrowMass(setup.m_grain)}>Grain aus Active Setup uebernehmen</button>
        </div>
      </section>

      <section className="result-grid">
        <article className="card">
          <h3>Speed <InfoHint text="Geschaetzte Startgeschwindigkeit in fps und m/s fuer das aktuelle Setup." /></h3>
          <p>{result.speed_fps.toFixed(2)} fps</p>
          <small>{result.speed_ms.toFixed(2)} m/s</small>
        </article>
        <article className="card">
          <h3>Energie <InfoHint text="Aus der geschaetzten Geschwindigkeit werden kinetische Energie und Impuls des Pfeils abgeleitet." /></h3>
          <p>{result.energy_J.toFixed(2)} J</p>
          <small>Impuls {result.impulse_Ns.toFixed(4)} Ns</small>
        </article>
      </section>

      <section className="card accent-card accent-cyan">
        <div className="table-header">
          <div>
            <h3>Chronograph-Abgleich <InfoHint text="Mehrere gemessene Geschwindigkeiten werden gemittelt, statistisch bewertet und koennen in das globale Setup uebernommen werden." /></h3>
            <p>Kommagetrennte Liste gemessener fps-Werte.</p>
          </div>
        </div>
        <div className="layout-grid compact-grid">
          <label className="field">
            <span>Messwerte (fps)</span>
            <input value={chronoInput} onChange={(event) => setChronoInput(event.target.value)} />
          </label>
        </div>
        <div className="result-grid">
          <article className="card">
            <h4>Mittelwert</h4>
            <p>{chronoStats.mean_fps.toFixed(2)} fps</p>
            <small>Median {chronoStats.median_fps.toFixed(2)} fps</small>
          </article>
          <article className="card">
            <h4>Streuung</h4>
            <p>{chronoStats.stdDev_fps.toFixed(2)} fps</p>
            <small>Min {chronoStats.min_fps.toFixed(2)} | Max {chronoStats.max_fps.toFixed(2)}</small>
          </article>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={() => updateSetup({ v_fps: chronoStats.mean_fps })}>Chrono-Mittelwert uebernehmen</button>
          <button type="button" onClick={() => upsertChronoSession(buildChronoSession(chronoValues))}>Chrono-Session speichern</button>
        </div>
        {chronoStats.stdDev_fps > 4 && <section className="warning"><strong>Hinweis:</strong> Die Streuung ist relativ hoch. Messreihe oder Setup pruefen.</section>}
      </section>

      <section className="card">
        <h3>Gespeicherte Chrono-Sessions</h3>
        {chronoSessions.length === 0 ? (
          <p>Noch keine gespeicherten Chrono-Sessions.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Eintraege</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {chronoSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.name}</td>
                    <td>{session.entries.length}</td>
                    <td className="inline-actions">
                      <button type="button" onClick={() => updateSetup({ v_fps: computeChronoStats(session.entries).mean_fps })}>Mittelwert uebernehmen</button>
                      <button type="button" onClick={() => removeChronoSession(session.id)}>Loeschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isExtreme && <section className="warning"><strong>Warnung:</strong> Ergebnis liegt in einem extremen Bereich.</section>}
    </main>
  )
}
