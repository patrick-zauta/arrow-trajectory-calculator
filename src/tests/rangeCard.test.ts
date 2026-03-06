import { describe, expect, it } from "vitest"
import { generateRangeCardRows } from "../lib/rangeCard"
import { DEFAULT_ADVANCED, DEFAULT_SETUP, DEFAULT_WIND } from "../store/useAppStore"

describe("range card generator", () => {
  it("returns expected row count and stable values", () => {
    const rows = generateRangeCardRows([10, 20, 30, 40], 0, DEFAULT_SETUP, DEFAULT_ADVANCED, DEFAULT_WIND, false)

    expect(rows).toHaveLength(4)
    expect(rows[0].distance_m).toBe(10)
    expect(Number.isFinite(rows[2].holdover_cm)).toBe(true)
  })
})