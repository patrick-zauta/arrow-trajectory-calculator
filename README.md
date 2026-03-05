# Arrow Trajectory Calculator

A simple React + Vite app to estimate arrow drop over distance.

[![Deploy to GitHub Pages](https://github.com/patrick-zauta/arrow-trajectory-calculator/actions/workflows/deploy.yml/badge.svg)](https://github.com/patrick-zauta/arrow-trajectory-calculator/actions/workflows/deploy.yml)

## Development

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build production bundle: `npm run build`
- Preview production build: `npm run preview`

## Deployment auf GitHub Pages

1. Repo Settings oeffnen: `Settings -> Pages`
2. Unter `Build and deployment` als Source `GitHub Actions` auswaehlen
3. Danach reicht ein Push auf `main`, der Workflow deployed automatisch
4. URL-Format: `https://<user>.github.io/<repo>/`
5. Routing-Hinweis: Bei SPA-Routing sind die URLs mit `#`, z. B. `/#/rechner`

### Troubleshooting

- Weisse Seite: `base` falsch oder Asset-Pfade beginnen mit `/`
- 404 bei Unterseiten: `BrowserRouter` statt `HashRouter`