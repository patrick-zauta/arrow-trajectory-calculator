import { InfoSection } from "../components/InfoSection"

export function InfoPage() {
  return (
    <main className="page">
      <header className="hero">
        <h2>Info</h2>
        <p>Dokumentation zu Modell, Annahmen und Nutzung.</p>
      </header>

      <InfoSection />

      <section className="card">
        <h3>Hinweise</h3>
        <ul>
          <li>Simulation Mode "Excel kompatibel" entspricht dem bisherigen Modell.</li>
          <li>Simulation Mode "Physik sauber" nutzt signierten Drag entlang des Geschwindigkeitsvektors.</li>
          <li>Setup Rechner ist eine Schätzung und kein Kern-Ballistikmodell.</li>
        </ul>
      </section>
    </main>
  )
}