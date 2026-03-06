import { InfoHint } from "../components/InfoHint"
import { InfoSection } from "../components/InfoSection"

export function InfoPage() {
  return (
    <main className="page">
      <header className="hero">
        <h2>
          Info{" "}
          <InfoHint text="Diese Seite dokumentiert die Modelle, Annahmen und Unterschiede zwischen den Rechenmodi der App." />
        </h2>
        <p>Dokumentation zu Modell, Annahmen und Nutzung.</p>
      </header>

      <InfoSection />

      <section className="card">
        <h3>Hinweise <InfoHint text="Kurze Einordnung der wichtigsten Modellannahmen und Grenzen der einzelnen Rechner." /></h3>
        <ul>
          <li>Simulation Mode "Excel kompatibel" entspricht dem bisherigen Modell.</li>
          <li>Simulation Mode "Physik sauber" nutzt signierten Drag entlang des Geschwindigkeitsvektors.</li>
          <li>Setup Rechner ist eine Schaetzung und kein Kern-Ballistikmodell.</li>
        </ul>
      </section>
    </main>
  )
}
