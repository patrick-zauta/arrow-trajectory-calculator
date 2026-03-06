# Arrow Trajectory Calculator

React + TypeScript Single Page Application als Web-Nachbau der Excel-Dateien (Kompakt / Datenreihen) fuer Pfeilflug, Flugkurve und Kennwerte.

[![Deploy to GitHub Pages](https://github.com/patrick-zauta/arrow-trajectory-calculator/actions/workflows/deploy.yml/badge.svg)](https://github.com/patrick-zauta/arrow-trajectory-calculator/actions/workflows/deploy.yml)

## Features

- Preset 1: `Standard (Excel Flugparabel_BSW)`
- Preset 2: `Pip_ELB_50_Holz 55-60 violett.lime`
- Einheitenumschaltung Geschwindigkeit: `fps` <-> `m/s`
- Winkelmodus:
  - Feineinstellung (Slider, +/- Buttons, Schritt 0.1 oder 0.01)
  - Direkteingabe (Number Input, Feineinstellung deaktiviert)
- Kennwerte:
  - Distanz Nullpunkt (m)
  - Distanz Scheitelpunkt (m)
  - Hoehe Scheitelpunkt (m)
- Flugkurvenchart mit Toggle:
  - Bis Scheitelpunkt
  - Bis Nullpunkt
- Stuetzpunkttabelle alle 2 m mit Excel-Approx-Match-Logik
- CSV Export der Tabelle
- localStorage Persistenz fuer letzte Eingaben
- Vitest Akzeptanztests gegen Excel-Zielwerte

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