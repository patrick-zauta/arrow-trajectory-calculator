import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { decodeShareParams } from "../../lib/share"
import { t } from "../../lib/i18n"
import { useAppStore } from "../../store/useAppStore"

const tabKeys = [
  { to: "/home", key: "start" },
  { to: "/flight", key: "flight" },
  { to: "/aim", key: "aim" },
  { to: "/calibration", key: "calibration" },
  { to: "/setup", key: "setup" },
  { to: "/compare", key: "compare" },
  { to: "/presets", key: "presets" },
  { to: "/sight-tape", key: "sightTape" },
  { to: "/analytics", key: "analytics" },
  { to: "/journal", key: "journal" },
  { to: "/info", key: "info" },
] as const

export function AppShell() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const setup = useAppStore((state) => state.activeSetup)
  const advanced = useAppStore((state) => state.advanced)
  const arrowBuilds = useAppStore((state) => state.arrowBuilds)
  const activeArrowBuildId = useAppStore((state) => state.activeArrowBuildId)
  const locale = useAppStore((state) => state.uiPreferences.locale)
  const updateSetup = useAppStore((state) => state.updateSetup)
  const updateAdvanced = useAppStore((state) => state.updateAdvanced)
  const setLocale = useAppStore((state) => state.setLocale)

  const summary = useMemo(
    () => `v ${setup.v_fps.toFixed(1)} fps | d ${setup.d_mm.toFixed(2)} mm | m ${setup.m_grain.toFixed(1)} grain | a ${setup.angle_deg.toFixed(2)} deg`,
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
          <div className="inline-actions">
            <div className="unit-switch" role="group" aria-label="Locale switcher">
              <button type="button" className={locale === "de" ? "active" : ""} onClick={() => setLocale("de")}>DE</button>
              <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button>
            </div>
            <button
              type="button"
              className="tabs-menu-btn"
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
              aria-controls="app-tabs"
            >
              {t(locale, "menu")}
            </button>
          </div>
        </div>

        <nav id="app-tabs" className={`tabs ${menuOpen ? "open" : ""}`} aria-label="App Navigation">
          {tabKeys.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {t(locale, tab.key)}
            </NavLink>
          ))}
        </nav>

        <div className="setup-summary" aria-live="polite">
          <span>{summary} | Pfeil: {arrowBuildName}</span>
          <button type="button" onClick={() => navigate("/flight")}>{t(locale, "gotoFlight")}</button>
        </div>
        <div className="setup-summary muted-note">
          <span>Idee von Guido Zauta | Umsetzung von Patrick Zauta | Release v0.0.1</span>
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
