export const FPS_TO_MPS_FACTOR = 0.3048
export const GRAIN_TO_KG_FACTOR = 0.0000647989

export function fpsToMps(valueFps: number): number {
  return valueFps * FPS_TO_MPS_FACTOR
}

export function mpsToFps(valueMps: number): number {
  return valueMps / FPS_TO_MPS_FACTOR
}

export function grainToKg(valueGrain: number): number {
  return valueGrain * GRAIN_TO_KG_FACTOR
}

export function mmToM(valueMm: number): number {
  return valueMm / 1000
}