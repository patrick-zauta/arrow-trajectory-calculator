import { Link } from "react-router-dom"
import { InfoHint } from "../components/InfoHint"
import { useAppStore } from "../store/useAppStore"

const appCards = [
  {
    to: "/flight",
    title: "Flugparabel",
    text: "Trajektorie, Kennwerte, Wind, Drift und Kalibrierung fuer den aktiven Pfeil.",
  },
  {
    to: "/aim",
    title: "Zielhilfe",
    text: "Holdover, Winkel-Solver und Range Card fuer reale Distanzen.",
  },
  {
    to: "/calibration",
    title: "Kalibrierung",
    text: "Separater Modus fuer Testschuesse, Drop-Messungen und das Anpassen von Cw oder k.",
  },
  {
    to: "/setup",
    title: "Setup Rechner",
    text: "Schaetzt die Startgeschwindigkeit aus Bogenparametern und uebernimmt sie direkt.",
  },
  {
    to: "/compare",
    title: "Vergleich",
    text: "Stellt zwei bis vier Setups gegeneinander und zeigt Unterschiede in der Kurve.",
  },
  {
    to: "/presets",
    title: "Preset Manager",
    text: "Verwaltet Presets, Arrow Builder, Komponenten und Sharing.",
  },
  {
    to: "/info",
    title: "Info",
    text: "Dokumentation, Modellannahmen und Referenzhinweise zur App.",
  },
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
          <span className="dashboard-label">Globales Setup <InfoHint text="Alle internen Rechner lesen und schreiben denselben Active-Setup-State. Änderungen sind sofort in den anderen Bereichen sichtbar." /></span>
          <strong>Synchron ueber alle Tools</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Konfiguration <InfoHint text="Presets, Pfeilgewicht, Winkel, Wind und Advanced-Parameter koennen in den jeweiligen Modulen angepasst und direkt uebernommen werden." /></span>
          <strong>Direkt uebernehmbar</strong>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-label">Deployment <InfoHint text="Die SPA ist fuer GitHub Pages ausgelegt und wird ueber HashRouter sowie den Actions-Workflow ausgeliefert." /></span>
          <strong>GitHub Pages bereit</strong>
        </article>
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
