import { describe, expect, it } from "vitest"
import { buildSupportPoints, simulateBallistics } from "../lib/ballistics"
import { DEFAULT_ADVANCED_SETTINGS } from "../lib/constants"
import type { UserInputs } from "../types/ballistics"

function expectWithin(actual: number, expected: number, tolerance: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe("ballistics excel parity", () => {
  it("matches preset 1 metrics", () => {
    const input: UserInputs = {
      speedValue: 150,
      speedUnit: "fps",
      diameterMm: 7.6,
      weightGrain: 440,
      angleDeg: 30,
    }

    const result = simulateBallistics(input, DEFAULT_ADVANCED_SETTINGS)

    expectWithin(result.nullDistanceM, 146.7826, 0.2)
    expectWithin(result.apexDistanceM, 77.6085, 0.2)
    expectWithin(result.apexHeightM, 23.6186, 0.2)
  })

  it("matches preset 2 metrics", () => {
    const input: UserInputs = {
      speedValue: 160,
      speedUnit: "fps",
      diameterMm: 8.7,
      weightGrain: 600,
      angleDeg: 45,
    }

    const result = simulateBallistics(input, DEFAULT_ADVANCED_SETTINGS)

    expectWithin(result.nullDistanceM, 180.0572, 0.2)
    expectWithin(result.apexDistanceM, 95.7462, 0.2)
    expectWithin(result.apexHeightM, 51.2496, 0.2)
  })

  it("creates support points with approx match logic", () => {
    const input: UserInputs = {
      speedValue: 150,
      speedUnit: "fps",
      diameterMm: 7.6,
      weightGrain: 440,
      angleDeg: 30,
    }

    const result = simulateBallistics(input, DEFAULT_ADVANCED_SETTINGS)
    const points = buildSupportPoints(result.points, 10, 2)

    expect(points.map((point) => point.targetDistanceM)).toEqual([0, 2, 4, 6, 8, 10])

    points.forEach((point) => {
      expect(point.effectiveDistanceM).toBeLessThanOrEqual(point.targetDistanceM)
    })
  })
})