import { useMemo, useState } from "react"
import { DraftNumberInput } from "../components/DraftNumberInput"
import { InfoHint } from "../components/InfoHint"
import { buildJournalEntry, buildJournalRound } from "../lib/journal"
import { useAppStore } from "../store/useAppStore"

export function JournalPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const journalEntries = useAppStore((state) => state.journalEntries)
  const fastTraining = useAppStore((state) => state.fastTraining)
  const addJournalEntry = useAppStore((state) => state.addJournalEntry)
  const removeJournalEntry = useAppStore((state) => state.removeJournalEntry)
  const updateFastTraining = useAppStore((state) => state.updateFastTraining)
  const startFastTraining = useAppStore((state) => state.startFastTraining)
  const addFastTrainingRound = useAppStore((state) => state.addFastTrainingRound)
  const removeLastFastTrainingRound = useAppStore((state) => state.removeLastFastTrainingRound)
  const saveFastTrainingToJournal = useAppStore((state) => state.saveFastTrainingToJournal)
  const resetFastTraining = useAppStore((state) => state.resetFastTraining)

  const [title, setTitle] = useState("Training")
  const [weather, setWeather] = useState("trocken, wenig Wind")
  const [notes, setNotes] = useState("")
  const [roundCount, setRoundCount] = useState(6)
  const [arrowsPerRound, setArrowsPerRound] = useState(8)

  const activeArrowBuild = useMemo(
    () => arrowBuilds.find((build) => build.id === activeArrowBuildId),
    [activeArrowBuildId, arrowBuilds],
  )

  const manualTotalArrows = Math.max(1, Math.round(roundCount)) * Math.max(1, Math.round(arrowsPerRound))
  const fastTotalArrows = fastTraining.rounds.reduce((sum, round) => sum + round.arrowCount, 0)

  const saveEntry = () => {
    const normalizedRoundCount = Math.max(1, Math.round(roundCount))
    const normalizedArrowsPerRound = Math.max(1, Math.round(arrowsPerRound))
    const rounds = Array.from({ length: normalizedRoundCount }, () => buildJournalRound(normalizedArrowsPerRound))

    addJournalEntry(
      buildJournalEntry(title, notes, weather, {
        setup,
        advanced,
        wind,
        activeArrowBuildId,
        activeArrowBuildName: activeArrowBuild?.name ?? "Kein Pfeil",
      }, {
        arrowsPerRound: normalizedArrowsPerRound,
        roundCount: normalizedRoundCount,
        rounds,
      }),
    )
    setNotes("")
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Journal</h2>
        <p>Lokales Schiessbuch fuer Sessions, Wetter, Trainingsrunden und gespeicherte Setup-Snapshots.</p>
        <div className="hero-meta">
          <span>Aktiver Pfeil: {activeArrowBuild?.name ?? "Kein Pfeilprofil"}</span>
          <span>{setup.v_fps.toFixed(1)} fps</span>
          <span>{setup.m_grain.toFixed(1)} grain</span>
        </div>
      </header>

      <section className="layout-grid">
        <article className="card accent-card accent-primary">
          <div className="table-header">
            <div>
              <h3>Session manuell erfassen</h3>
              <p>Runden und Pfeile direkt eingeben und als Eintrag speichern.</p>
            </div>
          </div>
          <div className="layout-grid compact-grid">
            <label className="field">
              <span>Titel</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Wetter <InfoHint text="Freitext fuer Wind, Temperatur, Feuchtigkeit oder Platzbedingungen." /></span>
              <input value={weather} onChange={(event) => setWeather(event.target.value)} />
            </label>
            <label className="field">
              <span>Runden <InfoHint text="Wie viele Ends oder Serien du in dieser Session geschossen hast." /></span>
              <DraftNumberInput value={roundCount} onCommit={(value) => setRoundCount(Math.max(1, Math.round(value ?? 1)))} aria-label="Runden" />
            </label>
            <label className="field">
              <span>Pfeile pro Runde <InfoHint text="Standard ist 8. Du kannst hier jede andere Pfeilzahl pro Runde setzen." /></span>
              <DraftNumberInput value={arrowsPerRound} onCommit={(value) => setArrowsPerRound(Math.max(1, Math.round(value ?? 8)))} aria-label="Pfeile pro Runde" />
            </label>
            <label className="field">
              <span>Notizen</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
            </label>
          </div>
          <div className="dashboard-strip">
            <article className="dashboard-stat">
              <span className="dashboard-label">Runden</span>
              <strong>{Math.max(1, Math.round(roundCount))}</strong>
            </article>
            <article className="dashboard-stat">
              <span className="dashboard-label">Pfeile pro Runde</span>
              <strong>{Math.max(1, Math.round(arrowsPerRound))}</strong>
            </article>
            <article className="dashboard-stat">
              <span className="dashboard-label">Total Pfeile</span>
              <strong>{manualTotalArrows}</strong>
            </article>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={saveEntry}>Session speichern</button>
          </div>
        </article>

        <article className="card accent-card accent-cyan">
          <div className="table-header">
            <div>
              <h3>Fast Training Mode</h3>
              <p>Training starten und pro Runde nur noch auf <strong>+</strong> klicken.</p>
            </div>
          </div>
          <div className="layout-grid compact-grid">
            <label className="field">
              <span>Trainingstitel <InfoHint text="Dieser Titel wird beim spaeteren Speichern des Trainings als Journal-Eintrag verwendet." /></span>
              <input
                value={fastTraining.title}
                onChange={(event) => updateFastTraining({ title: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Wetter</span>
              <input
                value={fastTraining.weather}
                onChange={(event) => updateFastTraining({ weather: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Pfeile pro Runde <InfoHint text="Jeder Klick auf den Plus-Button zaehlt genau diese Anzahl Pfeile zur laufenden Session dazu." /></span>
              <DraftNumberInput
                value={fastTraining.arrowsPerRound}
                onCommit={(value) => updateFastTraining({ arrowsPerRound: Math.max(1, Math.round(value ?? 8)) })}
                aria-label="Fast Training Pfeile pro Runde"
              />
            </label>
            <label className="field">
              <span>Trainingsnotizen</span>
              <textarea
                value={fastTraining.notes}
                onChange={(event) => updateFastTraining({ notes: event.target.value })}
                rows={4}
              />
            </label>
          </div>
          <div className="dashboard-strip">
            <article className="dashboard-stat">
              <span className="dashboard-label">Status</span>
              <strong>{fastTraining.active ? "Aktiv" : "Bereit"}</strong>
            </article>
            <article className="dashboard-stat">
              <span className="dashboard-label">Runden gezaehlt</span>
              <strong>{fastTraining.rounds.length}</strong>
            </article>
            <article className="dashboard-stat">
              <span className="dashboard-label">Total Pfeile</span>
              <strong>{fastTotalArrows}</strong>
            </article>
          </div>
          <div className="inline-actions">
            <button type="button" onClick={startFastTraining}>{fastTraining.active ? "Training laeuft" : "Training aktivieren"}</button>
            <button type="button" className="fast-training-plus" onClick={addFastTrainingRound} aria-label="Runde hinzufuegen">
              +
            </button>
            <button type="button" onClick={removeLastFastTrainingRound} disabled={fastTraining.rounds.length === 0}>Letzte Runde entfernen</button>
            <button type="button" onClick={saveFastTrainingToJournal} disabled={fastTraining.rounds.length === 0}>Training speichern</button>
            <button type="button" onClick={resetFastTraining}>Zuruecksetzen</button>
          </div>
          <ul className="pill-list">
            {fastTraining.rounds.length === 0 ? (
              <li>Noch keine Runde erfasst</li>
            ) : (
              fastTraining.rounds.map((round, index) => (
                <li key={round.id}>Runde {index + 1}: {round.arrowCount} Pfeile</li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="card">
        <h3>Eintraege <InfoHint text="Jeder Eintrag speichert Session-Metadaten, Gesamtpfeile, Runden und einen Snapshot aus Setup, Advanced-Werten, Wind und aktivem Pfeilprofil." /></h3>
        {journalEntries.length === 0 ? (
          <p>Noch keine gespeicherten Sessions.</p>
        ) : (
          <div className="stack">
            {journalEntries.map((entry) => (
              <article className="card" key={entry.id}>
                <div className="table-header">
                  <div>
                    <h4>{entry.title}</h4>
                    <p>{entry.createdAt}</p>
                  </div>
                  <button type="button" onClick={() => removeJournalEntry(entry.id)}>Loeschen</button>
                </div>
                <div className="dashboard-strip">
                  <article className="dashboard-stat">
                    <span className="dashboard-label">Runden</span>
                    <strong>{entry.roundCount}</strong>
                  </article>
                  <article className="dashboard-stat">
                    <span className="dashboard-label">Pfeile pro Runde</span>
                    <strong>{entry.arrowsPerRound}</strong>
                  </article>
                  <article className="dashboard-stat">
                    <span className="dashboard-label">Total Pfeile</span>
                    <strong>{entry.totalArrows}</strong>
                  </article>
                </div>
                <p><strong>Wetter:</strong> {entry.weather}</p>
                <p><strong>Notizen:</strong> {entry.notes || "-"}</p>
                <p><strong>Snapshot:</strong> {entry.snapshot.setup.v_fps.toFixed(1)} fps | {entry.snapshot.setup.m_grain.toFixed(1)} grain | {entry.snapshot.activeArrowBuildName}</p>
                <ul className="pill-list">
                  {entry.rounds.length === 0 ? (
                    <li>Keine Einzelrunden gespeichert</li>
                  ) : (
                    entry.rounds.map((round, index) => (
                      <li key={round.id}>Runde {index + 1}: {round.arrowCount} Pfeile</li>
                    ))
                  )}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
