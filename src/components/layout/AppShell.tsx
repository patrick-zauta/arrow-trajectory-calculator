import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { decodeShareParams } from "../../lib/share"
import { useAppStore } from "../../store/useAppStore"

const tabs = [
  { to: "/flight", label: "Flugparabel" },
  { to: "/aim", label: "Zielhilfe" },
  { to: "/setup", label: "Setup Rechner" },
  { to: "/compare", label: "Vergleich" },
  { to: "/presets", label: "Preset Manager" },
  { to: "/info", label: "Info" },
]

export function AppShell() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)

  const summary = useMemo(
    () =>
      `v ${setup.v_fps.toFixed(1)} fps | d ${setup.d_mm.toFixed(2)} mm | m ${setup.m_grain.toFixed(1)} grain | a ${setup.angle_deg.toFixed(2)}°`,
    [setup],
  )
  const arrowBuildName = useMemo(
    () => arrowBuilds.find((build) => build.id === activeArrowBuildId)?.name ?? "Kein Pfeilprofil",
    [activeArrowBuildId, arrowBuilds],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.toString()) {
      return
    }

    const decoded = decodeShareParams(params, { setup, advanced })
    updateSetup(decoded.setup)
    updateAdvanced(decoded.advanced)
    setToast("Share Setup aus URL geladen")
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  return (
    <div className="shell">
      <header className="topbar card">
        <div className="topbar-head">
          <div className="brand-block">
            <span className="brand-kicker">Ballistics Suite</span>
            <h1>Arrow Trajectory Calculator</h1>
            <p>Praezise Trajektorien, Zielhilfe und Setup-Vergleich in einer statischen Web App.</p>
          </div>
          <button
            type="button"
            className="tabs-menu-btn"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="app-tabs"
          >
            Menue
          </button>
        </div>

        <nav id="app-tabs" className={`tabs ${menuOpen ? "open" : ""}`} aria-label="App Navigation">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="setup-summary" aria-live="polite">
          <span>{summary} | Pfeil: {arrowBuildName}</span>
          <button type="button" onClick={() => navigate("/flight")}>Zur Flugparabel</button>
        </div>
        <div className="setup-summary muted-note">
          <span>Idee von Guido Zauta | Umsetzung von Patrick Zauta</span>
        </div>
        {toast && <div className="toast">{toast}</div>}
      </header>

      <Outlet />

      <footer className="site-footer">
        <span>Idee von Guido Zauta</span>
        <span>Umsetzung von Patrick Zauta</span>
        <span>Copyright by Zauta</span>
      </footer>
    </div>
  )
}
