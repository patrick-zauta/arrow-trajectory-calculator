# AGENTS.md

## Project

- Name: Arrow Trajectory Calculator
- Type: Single Page Application (React + TypeScript + Vite)
- Runtime: Browser only (no backend, no API calls)
- Deployment target: GitHub Pages (static)
- Current release: `v0.1.0`

## Goals

- Reproduce Excel behavior for:
  - Kompakt
  - Datenreihen
- Provide info sections for Theorie and Quellen.
- Keep simulation behavior Excel-compatible where the reference mode requires it, including:
  - `asy = as * abs(vy / speed)`
- Maintain a production-quality browser app with strong consistency across all calculators.

## Core Technical Rules

1. Vite config must keep:
- `base: "./"`

2. Routing must be Pages-safe:
- Use `HashRouter`
- Do not use `BrowserRouter` for deployed Pages build

3. Build output:
- `dist/`

4. No backend:
- All calculations and UI logic run in browser
- No external API requests

## App Structure

- `src/components`: UI modules
- `src/hooks`: reusable hooks (debounce, localStorage, input helpers)
- `src/lib`: simulation, units, validation, presets, csv, analytics helpers
- `src/pages`: page composition
- `src/tests`: Vitest tests
- `src/types`: shared TS types

## Calculation Contract

- Units:
  - `v_ms = v_fps * 0.3048`
  - `m_kg = grain * 0.0000647989`
  - `A = pi * ((d_mm / 2 / 1000)^2)`
  - `k = 0.5 * rho * Cw * A / m_kg`
- Integrator:
  - time step loop with `dt`
  - trapezoidal updates for x and y
- Land index:
  - ignore first 4 entries
  - choose index with minimal `abs(y)`
- Apex index:
  - index with maximal `y`
- Support points (table):
  - target distances every 2m
  - approx-match via last index where `x <= target`

## Quality Rules introduced up to v0.1.0

- Use central conversion and adapter helpers where possible.
- Prefer draft-based numeric inputs for manual editing so fields do not jump during typing.
- Keep global state migration-safe.
- Prefer lazy-loading for larger route modules.
- Keep tooltips accessible and non-disruptive for headings and labels.
- Preserve consistent chart semantics across pages.

## Input Limits

Extended ranges (hard validation):
- fps: 20..1200
- diameter mm: 2.0..20.0
- grain: 50..2000
- angle deg: 0..90
- dt: 0.0005..0.01
- maxTimeSec: 5..60

Legacy Excel ranges (warning only):
- fps: 50..500
- diameter mm: 4.0..10.0
- grain: 100..600
- angle deg: 0..90

## Testing Requirements

- Use Vitest
- Keep acceptance checks for both presets with tolerance 0.2m:
  - Preset 1:
    - Nullpunkt ~= 146.7826
    - Scheitel Distanz ~= 77.6085
    - Scheitel Hoehe ~= 23.6186
  - Preset 2:
    - Nullpunkt ~= 180.0572
    - Scheitel Distanz ~= 95.7462
    - Scheitel Hoehe ~= 51.2496
- Cover core helpers for:
  - zeroing
  - grouping
  - chrono statistics
  - terrain
  - builder/FOC
  - store persistence

## Versioning Policy

- Version format must be `vX.Y.Z`.
- Initial baseline: `v0.0.0`.
- Patch release increments by `+0.0.1`.
- Current quality release: `v0.1.0`.
- Examples:
  - `v0.0.0 -> v0.0.1`
  - `v0.0.1 -> v0.0.2`
  - `v0.0.10 -> v0.1.0`
- For this repository, default to patch updates unless explicitly specified otherwise.

## Deployment Rules

- Keep `.github/workflows/deploy.yml` active for auto deploy on push to `main`.
- Required workflow permissions:
  - `pages: write`
  - `id-token: write`
- Required user one-time setup:
  - GitHub `Settings -> Pages -> Source: GitHub Actions`

## Developer Notes

- Keep strict TypeScript types.
- Avoid `any`.
- Keep logic in `lib/ballistics.ts` deterministic and testable.
- Maintain relative asset paths for Pages compatibility.
- Avoid reintroducing duplicate solver or formatting logic across pages.
