import { beforeEach, describe, expect, it, vi } from "vitest"

describe("useAppStore", () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.resetModules()
  })

  it("initializes with defaults", async () => {
    const { useAppStore, DEFAULT_SETUP } = await import("../store/useAppStore")
    expect(useAppStore.getState().activeSetup).toEqual(DEFAULT_SETUP)
    expect(useAppStore.getState().heightDisplayUnit).toBe("cm")
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
        arrowBuilds: [],
        activeArrowBuildId: "custom-build",
        heightDisplayUnit: "m",
      },
      version: 0,
    }

    localStorage.setItem("arrow-app-state-v1", JSON.stringify(initial))

    const { useAppStore } = await import("../store/useAppStore")
    const state = useAppStore.getState()

    expect(state.activeSetup.v_fps).toBe(222)
    expect(state.activeSetup.m_grain).toBe(777)
    expect(state.heightDisplayUnit).toBe("m")
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

  it("switches display unit and persists it in state", async () => {
    const { useAppStore, createDefaultState } = await import("../store/useAppStore")
    useAppStore.setState(createDefaultState())

    useAppStore.getState().setHeightDisplayUnit("m")

    expect(useAppStore.getState().heightDisplayUnit).toBe("m")
  })

  it("saves and applies arrow builds", async () => {
    const { useAppStore, createDefaultState } = await import("../store/useAppStore")
    useAppStore.setState(createDefaultState())
    useAppStore.getState().setComponents([
      { id: "a", name: "Schaft", weight_grain: 300, category: "Shaft", position_mm: 380 },
      { id: "b", name: "Spitze", weight_grain: 120, category: "Spitze", position_mm: 760 },
    ])

    const build = useAppStore.getState().saveCurrentComponentsAsArrowBuild("Mein Pfeil")
    useAppStore.getState().applyArrowBuild(build.id)

    expect(useAppStore.getState().activeArrowBuildId).toBe(build.id)
    expect(useAppStore.getState().activeSetup.m_grain).toBe(420)
  })

  it("tracks fast training rounds and saves them into the journal", async () => {
    const { useAppStore, createDefaultState } = await import("../store/useAppStore")
    useAppStore.setState(createDefaultState())

    useAppStore.getState().updateFastTraining({ title: "Abendtraining", arrowsPerRound: 8 })
    useAppStore.getState().startFastTraining()
    useAppStore.getState().addFastTrainingRound()
    useAppStore.getState().addFastTrainingRound()

    const entry = useAppStore.getState().saveFastTrainingToJournal()
    const state = useAppStore.getState()

    expect(entry?.roundCount).toBe(2)
    expect(entry?.totalArrows).toBe(16)
    expect(state.journalEntries[0]?.title).toBe("Abendtraining")
    expect(state.fastTraining.active).toBe(false)
    expect(state.fastTraining.rounds).toHaveLength(0)
  })
})
