import type { AdvancedParams, ArrowSetup } from "./types"

export interface ShareSetupPayload {
  setup: ArrowSetup
  advanced: AdvancedParams
}

export function encodeShareParams(payload: ShareSetupPayload): URLSearchParams {
  const params = new URLSearchParams()
  params.set("v", String(payload.setup.v_fps))
  params.set("d", String(payload.setup.d_mm))
  params.set("m", String(payload.setup.m_grain))
  params.set("a", String(payload.setup.angle_deg))
  params.set("cw", String(payload.advanced.cw))
  params.set("rho", String(payload.advanced.rho))
  params.set("g", String(payload.advanced.g))
  params.set("dt", String(payload.advanced.dt))
  params.set("t", String(payload.advanced.maxTimeSec))

  return params
}

function toNumber(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function decodeShareParams(params: URLSearchParams, fallback: ShareSetupPayload): ShareSetupPayload {
  return {
    setup: {
      v_fps: toNumber(params.get("v"), fallback.setup.v_fps),
      d_mm: toNumber(params.get("d"), fallback.setup.d_mm),
      m_grain: toNumber(params.get("m"), fallback.setup.m_grain),
      angle_deg: toNumber(params.get("a"), fallback.setup.angle_deg),
    },
    advanced: {
      ...fallback.advanced,
      cw: toNumber(params.get("cw"), fallback.advanced.cw),
      rho: toNumber(params.get("rho"), fallback.advanced.rho),
      g: toNumber(params.get("g"), fallback.advanced.g),
      dt: toNumber(params.get("dt"), fallback.advanced.dt),
      maxTimeSec: toNumber(params.get("t"), fallback.advanced.maxTimeSec),
    },
  }
}