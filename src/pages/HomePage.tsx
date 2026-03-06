import { Link } from "react-router-dom"
import { InfoHint } from "../components/InfoHint"
import { useAppStore } from "../store/useAppStore"

const appCards = [
  { to: "/flight", title: "Flugparabel", text: "Trajektorie, Kennwerte, Wind, Drift, Zeroing und Terrain fuer den aktiven Pfeil." },
  { to: "/aim", title: "Zielhilfe", text: "Holdover, Winkel-Solver, Range Card und Druckansichten." },
  { to: "/calibration", title: "Kalibrierung", text: "Separater Modus fuer Testschuesse, Drop-Messungen und das Anpassen von Cw oder k." },
  { to: "/setup", title: "Setup Rechner", text: "Schaetzt die Startgeschwindigkeit und bietet einen Chronograph-Abgleich." },
  { to: "/compare", title: "Vergleich", text: "Stellt mehrere Setups gegeneinander und zeigt Unterschiede in Kurven und Kennwerten." },
  { to: "/presets", title: "Preset Manager", text: "Verwaltet Presets, Arrow Builder, FOC, Komponenten und Materialbibliothek." },
  { to: "/sight-tape", title: "Sight Tape", text: "Erzeugt Visierband- und Holdover-Tabellen fuer definierte Distanzen." },
  { to: "/analytics", title: "Analyse", text: "Sensitivity Analysis, Streukreis und Differenz-Heatmap fuer mehrere Setups." },
  { to: "/journal", title: "Journal", text: "Speichert Schiesssessions, Wetter, Notizen und Setup-Snapshots." },
  { to: "/info", title: "Info", text: "Dokumentation, Modellannahmen und Referenzhinweise zur App." },
]

const wizardSteps = [
  { to: "/presets", title: "1. Pfeil konfigurieren", text: "Arrow Builder und FOC aufbauen." },
  { to: "/setup", title: "2. Geschwindigkeit pruefen", text: "Schaetzung oder Chronograph-Abgleich uebernehmen." },
  { to: "/calibration", title: "3. Testschuesse kalibrieren", text: "Drop messen und Widerstand anpassen." },
  { to: "/flight", title: "4. Flugbahn validieren", text: "Wind, Terrain, Zeroing und Kurven pruefen." },
  { to: "/aim", title: "5. Zielhilfe erzeugen", text: "Holdover, Range Card und Solver nutzen." },
  { to: "/sight-tape", title: "6. Output drucken", text: "Sight Tape oder Range Card fuer die Range ausgeben." },
]

export function HomePage() {
  const setup = useAppStore((state) => state.activeSetup)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const activeBuild = arrowBuilds.find((build) => build.id === activeArrowBuildId)

  return (
    <main className="page">
      <header className="hero">
        <h2>Start</h2>
        <p>Die App ist als zentrales Dashboard aufgebaut. Alle Rechner arbeiten mit demselben Active Setup und demselben aktiven Pfeilprofil.</p>
        <div className="hero-meta">
          <span>Aktiver Pfeil: {activeBuild?.name ?? "Kein Pfeilprofil"}</span>
          <span>v {setup.v_fps.toFixed(1)} fps</span>
          <span>m {setup.m_grain.toFixed(1)} grain</span>
        </div>
      </header>

      <section className="dashboard-strip">
        <article className="dashboard-stat">
          <span className="dashboard-label">Globales Setup <InfoHint text="Alle internen Rechner lesen und schreiben denselben Active-Setup-State. Aenderungen sind sofort in den anderen Bereichen sichtbar." /></span>
          <strong>Synchron ueber alle Tools</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Konfiguration <InfoHint text="Presets, Pfeilgewicht, Winkel, Wind, Terrain und Advanced-Parameter koennen in den jeweiligen Modulen angepasst und direkt uebernommen werden." /></span>
          <strong>Direkt uebernehmbar</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Guided Mode <InfoHint text="Der gefuehrte Modus zeigt den empfohlenen Arbeitsablauf von Pfeilbau ueber Kalibrierung bis zur Druckausgabe." /></span>
          <strong>End-to-end Workflow</strong>
        </article>
      </section>

      <section className="card accent-card accent-primary">
        <div className="table-header">
          <div>
            <h3>Gefuehrter Modus</h3>
            <p>Empfohlene Reihenfolge fuer einen belastbaren Workflow von Konfiguration bis Druckausgabe.</p>
          </div>
        </div>
        <div className="app-grid">
          {wizardSteps.map((step) => (
            <Link key={step.to} to={step.to} className="app-card">
              <div className="app-card-head">
                <h3>{step.title}</h3>
                <InfoHint text={step.text} />
              </div>
              <p>{step.text}</p>
              <span className="app-card-cta">Weiter</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="app-grid">
        {appCards.map((card) => (
          <Link key={card.to} to={card.to} className="app-card">
            <div className="app-card-head">
              <h3>{card.title}</h3>
              <InfoHint text={card.text} />
            </div>
            <p>{card.text}</p>
            <span className="app-card-cta">Oeffnen</span>
          </Link>
        ))}
      </section>
    </main>
  )
}
