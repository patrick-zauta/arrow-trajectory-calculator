import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "./components/layout/AppShell"

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })))
const FlightPage = lazy(() => import("./pages/FlightPage").then((module) => ({ default: module.FlightPage })))
const AimPage = lazy(() => import("./pages/AimPage").then((module) => ({ default: module.AimPage })))
const CalibrationPage = lazy(() => import("./pages/CalibrationPage").then((module) => ({ default: module.CalibrationPage })))
const SetupPage = lazy(() => import("./pages/SetupPage").then((module) => ({ default: module.SetupPage })))
const ComparePage = lazy(() => import("./pages/ComparePage").then((module) => ({ default: module.ComparePage })))
const PresetsPage = lazy(() => import("./pages/PresetsPage").then((module) => ({ default: module.PresetsPage })))
const SightTapePage = lazy(() => import("./pages/SightTapePage").then((module) => ({ default: module.SightTapePage })))
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })))
const JournalPage = lazy(() => import("./pages/JournalPage").then((module) => ({ default: module.JournalPage })))
const InfoPage = lazy(() => import("./pages/InfoPage").then((module) => ({ default: module.InfoPage })))
const RangePrintPage = lazy(() => import("./pages/RangePrintPage").then((module) => ({ default: module.RangePrintPage })))

function LoadingPage() {
  return <main className="page"><section className="card">Ansicht wird geladen...</section></main>
}

function App() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="flight" element={<FlightPage />} />
          <Route path="aim" element={<AimPage />} />
          <Route path="calibration" element={<CalibrationPage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="presets" element={<PresetsPage />} />
          <Route path="sight-tape" element={<SightTapePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="info" element={<InfoPage />} />
        </Route>
        <Route path="/range-print" element={<RangePrintPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
