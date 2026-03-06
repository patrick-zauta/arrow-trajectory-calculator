import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "./components/layout/AppShell"
import { AimPage } from "./pages/AimPage"
import { CalibrationPage } from "./pages/CalibrationPage"
import { ComparePage } from "./pages/ComparePage"
import { FlightPage } from "./pages/FlightPage"
import { HomePage } from "./pages/HomePage"
import { InfoPage } from "./pages/InfoPage"
import { PresetsPage } from "./pages/PresetsPage"
import { RangePrintPage } from "./pages/RangePrintPage"
import { SetupPage } from "./pages/SetupPage"

function App() {
  return (
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
        <Route path="info" element={<InfoPage />} />
      </Route>
      <Route path="/range-print" element={<RangePrintPage />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default App
