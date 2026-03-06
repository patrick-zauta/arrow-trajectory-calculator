import type { Locale } from "./types"

const translations = {
  de: {
    start: "Start",
    flight: "Flugparabel",
    aim: "Zielhilfe",
    calibration: "Kalibrierung",
    setup: "Setup Rechner",
    compare: "Vergleich",
    presets: "Preset Manager",
    sightTape: "Sight Tape",
    analytics: "Analyse",
    journal: "Journal",
    info: "Info",
    menu: "Menue",
    gotoFlight: "Zur Flugparabel",
  },
  en: {
    start: "Home",
    flight: "Trajectory",
    aim: "Aim Help",
    calibration: "Calibration",
    setup: "Setup Estimator",
    compare: "Compare",
    presets: "Preset Manager",
    sightTape: "Sight Tape",
    analytics: "Analytics",
    journal: "Journal",
    info: "Info",
    menu: "Menu",
    gotoFlight: "Go to Trajectory",
  },
} as const

export type TranslationKey = keyof typeof translations.de

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] ?? translations.de[key]
}
