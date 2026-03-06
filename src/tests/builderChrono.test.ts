import { describe, expect, it } from "vitest"
import { computeFoc } from "../lib/componentsBuilder"
import { computeChronoStats } from "../lib/chrono"

describe("builder and chrono", () => {
  it("computes foc from build geometry", () => {
    const result = computeFoc({
      id: "build-1",
      name: "Test",
      arrowLength_mm: 760,
      components: [
        { id: "shaft", name: "Shaft", category: "Shaft", weight_grain: 300, position_mm: 380 },
        { id: "point", name: "Point", category: "Spitze", weight_grain: 100, position_mm: 770 },
      ],
    })

    expect(result.totalWeightGrain).toBe(400)
    expect(result.balancePointMm).toBeGreaterThan(380)
    expect(result.focPercent).toBeGreaterThan(0)
  })

  it("computes chrono stats", () => {
    const stats = computeChronoStats([
      { id: "1", label: "1", speed_fps: 148 },
      { id: "2", label: "2", speed_fps: 150 },
      { id: "3", label: "3", speed_fps: 152 },
    ])

    expect(stats.mean_fps).toBeCloseTo(150, 5)
    expect(stats.median_fps).toBe(150)
    expect(stats.stdDev_fps).toBeGreaterThan(0)
  })
})
