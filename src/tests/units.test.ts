import { describe, expect, it } from "vitest"
import { formatHeightUnitLabel, fpsToMps, metersToHeightUnit, mpsToFps } from "../lib/units"

describe("unit helpers", () => {
  it("converts speed between fps and mps roundtrip", () => {
    const fps = 200
    const mps = fpsToMps(fps)

    expect(mpsToFps(mps)).toBeCloseTo(fps, 8)
  })

  it("formats vertical units for cm and m", () => {
    expect(metersToHeightUnit(1.23, "cm")).toBeCloseTo(123, 8)
    expect(metersToHeightUnit(1.23, "m")).toBeCloseTo(1.23, 8)
    expect(formatHeightUnitLabel("cm")).toBe("cm")
    expect(formatHeightUnitLabel("m")).toBe("m")
  })
})
