import { beforeEach, describe, expect, it, vi } from "vitest"

describe("useAppStore", () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
  })

  it("initializes with defaults", async () => {
    const { useAppStore, DEFAULT_SETUP } = await import("../store/useAppStore")
    expect(useAppStore.getState().activeSetup).toEqual(DEFAULT_SETUP)
  })

  it("persists and loads from localStorage", async () => {
    const initial = {
      state: {
        activeSetup: { v_fps: 222, d_mm: 9.1, m_grain: 777, angle_deg: 35 },
        advanced: { cw: 2.5, rho: 1.2, g: 9.81, dt: 0.001, maxTimeSec: 30, k_override: null, simulationMode: "excel" },
        wind: { enabled: false, windSpeed_mps: 0, windDirection_deg: 90 },
        presets: [],
        activePresetId: "x",
        components: [],
      },
      version: 0,
    }

    localStorage.setItem("arrow-app-state-v1", JSON.stringify(initial))

    const { useAppStore } = await import("../store/useAppStore")
    const state = useAppStore.getState()

    expect(state.activeSetup.v_fps).toBe(222)
    expect(state.activeSetup.m_grain).toBe(777)
  })

  it("updates only requested setup fields", async () => {
    const { useAppStore, createDefaultState } = await import("../store/useAppStore")
    useAppStore.setState(createDefaultState())

    useAppStore.getState().updateSetup({ v_fps: 199 })

    const state = useAppStore.getState()
    expect(state.activeSetup.v_fps).toBe(199)
    expect(state.activeSetup.d_mm).toBe(7.6)
    expect(state.activeSetup.m_grain).toBe(440)
  })
})