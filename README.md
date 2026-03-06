# Arrow Trajectory Calculator

React + TypeScript Single Page Application als eigenstaendige Ballistik-App fuer Pfeilflug, Flugkurve und Kennwerte.

[![Deploy to GitHub Pages](https://github.com/patrick-zauta/arrow-trajectory-calculator/actions/workflows/deploy.yml/badge.svg)](https://github.com/patrick-zauta/arrow-trajectory-calculator/actions/workflows/deploy.yml)

## Features

- Reiter-Navigation mit HashRouter:
  - `/#/flight`
  - `/#/aim`
  - `/#/setup`
  - `/#/compare`
  - `/#/presets`
  - `/#/info`
- Globaler Active Setup State (Zustand + localStorage Persistenz)
- Flugparabel mit Kennwerten, Holdover-Tabelle, Winddrift und Kalibrierung
- Zielhilfe mit Holdover, Winkel-Solver, Pin-Empfehlung und Range Card
- Setup Rechner fuer Geschwindigkeitsschaetzung aus Bogenparametern
- Vergleichsmodus fuer bis zu vier Setups mit Overlay-Chart
- Preset Manager mit Import/Export und Share-Link-Parameter
- Komponenten Builder mit Live-Gewichtssumme und Uebernahme in Active Setup
- Print View Route fuer Range Card: `/#/range-print`
- Vitest Test-Suite fuer Rechenkerne, Store, Routing und Import/Export

## Tech Stack

- Vite + React + TypeScript
- HashRouter fuer GitHub Pages SPA Routing
- Recharts fuer Flugkurve
- Vitest fuer Tests

## Lokaler Start

1. `npm install`
2. `npm run dev`
3. App im Browser oeffnen (Vite URL aus Terminal)

## Build und Test

- Build: `npm run build`
- Preview: `npm run preview`
- Tests: `npm run test`

## Deployment auf GitHub Pages

1. In GitHub das Repo oeffnen
2. `Settings -> Pages`
3. Unter `Build and deployment` als Source `GitHub Actions` waehlen
4. Push auf `main` ausfuehren
5. Workflow deployed automatisch

URL-Format:
`https://<user>.github.io/<repo>/`

Routing-Hinweis:
Bei SPA-Routing mit `HashRouter` sehen Unterseiten so aus:
`/#/rechner`

## GitHub Actions Workflow

Workflow-Datei: `.github/workflows/deploy.yml`

- Trigger: `push` auf `main`, `workflow_dispatch`
- Node: `20`
- Steps:
  - `npm ci`
  - `npm run build`
  - Upload `dist/` als Pages Artifact
  - Deploy zu GitHub Pages

## Troubleshooting

- Weisse Seite nach Deploy:
  - `vite.config.ts` muss `base: "./"` verwenden
  - Keine Asset-Pfade mit fuehrendem `/`
- 404 auf Unterseiten:
  - `HashRouter` statt `BrowserRouter` verwenden
- Abweichende Kennwerte:
  - `dt` und `maxTimeSec` in Advanced Settings pruefen
  - Eingabeeinheit (`fps` oder `m/s`) pruefen
