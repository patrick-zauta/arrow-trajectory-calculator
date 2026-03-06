import { describe, expect, it } from "vitest"
import { buildTerrainSeries, findTerrainImpact, terrainHeightAtDistance } from "../lib/terrain"

describe("terrain", () => {
  it("computes terrain height from slope", () => {
    expect(terrainHeightAtDistance({ enabled: true, slope_deg: 0, offset_m: 2 }, 50)).toBeCloseTo(2, 6)
    expect(terrainHeightAtDistance({ enabled: true, slope_deg: 10, offset_m: 0 }, 10)).toBeGreaterThan(0)
  })

  it("finds terrain impact", () => {
    const impact = findTerrainImpact(
      [
        { timeSec: 0, xM: 0, yM: 0, zM: 0, vxMs: 0, vyMs: 0, vzMs: 0 },
        { timeSec: 1, xM: 10, yM: 1, zM: 0, vxMs: 0, vyMs: 0, vzMs: 0 },
        { timeSec: 2, xM: 20, yM: 0.5, zM: 0, vxMs: 0, vyMs: 0, vzMs: 0 },
      ],
      { enabled: true, slope_deg: 5, offset_m: 0 },
    )

    expect(impact).not.toBeNull()
    expect(buildTerrainSeries(20, { enabled: true, slope_deg: 5, offset_m: 0 })).toHaveLength(81)
  })
})
