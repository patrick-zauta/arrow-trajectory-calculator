import { describe, expect, it } from "vitest"
import { decodeShareParams, encodeShareParams } from "../lib/share"
import { parsePresetImport } from "../lib/presetIO"
import { DEFAULT_ADVANCED, DEFAULT_SETUP } from "../store/useAppStore"

describe("share and import", () => {
  it("encode/decode roundtrip", () => {
    const encoded = encodeShareParams({ setup: DEFAULT_SETUP, advanced: DEFAULT_ADVANCED })
    const decoded = decodeShareParams(encoded, { setup: DEFAULT_SETUP, advanced: DEFAULT_ADVANCED })

    expect(decoded.setup.v_fps).toBe(DEFAULT_SETUP.v_fps)
    expect(decoded.setup.d_mm).toBe(DEFAULT_SETUP.d_mm)
    expect(decoded.advanced.cw).toBe(DEFAULT_ADVANCED.cw)
  })

  it("validates import schema", () => {
    const invalid = JSON.stringify({ version: 1, presets: [{ name: "x" }] })

    expect(() => parsePresetImport(invalid)).toThrowError()
  })
})