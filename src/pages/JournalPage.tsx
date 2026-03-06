import { useMemo, useState } from "react"
import { InfoHint } from "../components/InfoHint"
import { buildJournalEntry } from "../lib/journal"
import { useAppStore } from "../store/useAppStore"

export function JournalPage() {
  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const wind = useAppStore((state) => state.wind)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const journalEntries = useAppStore((state) => state.journalEntries)
  const addJournalEntry = useAppStore((state) => state.addJournalEntry)
  const removeJournalEntry = useAppStore((state) => state.removeJournalEntry)

  const [title, setTitle] = useState("Training")
  const [weather, setWeather] = useState("trocken, wenig Wind")
  const [notes, setNotes] = useState("")

  const activeArrowBuild = useMemo(
    () => arrowBuilds.find((build) => build.id === activeArrowBuildId),
    [activeArrowBuildId, arrowBuilds],
  )

  const saveEntry = () => {
    addJournalEntry(
      buildJournalEntry(title, notes, weather, {
        setup,
        advanced,
        wind,
        activeArrowBuildId,
        activeArrowBuildName: activeArrowBuild?.name ?? "Kein Pfeil",
      }),
    )
    setNotes("")
  }

  return (
    <main className="page">
      <header className="hero">
        <h2>Journal</h2>
        <p>Lokales Schiessbuch fuer Sessions, Wetter, Notizen und gespeicherte Setup-Snapshots.</p>
      </header>

      <section className="card accent-card accent-primary">
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
            <span>Notizen</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
          </label>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={saveEntry}>Session speichern</button>
        </div>
      </section>

      <section className="card">
        <h3>Eintraege <InfoHint text="Jeder Eintrag speichert einen Snapshot aus Setup, Advanced-Werten, Wind und aktivem Pfeilprofil." /></h3>
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
                <p><strong>Wetter:</strong> {entry.weather}</p>
                <p><strong>Notizen:</strong> {entry.notes || "-"}</p>
                <p><strong>Snapshot:</strong> {entry.snapshot.setup.v_fps.toFixed(1)} fps | {entry.snapshot.setup.m_grain.toFixed(1)} grain | {entry.snapshot.activeArrowBuildName}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
