import type { ChronoEntry } from "./types"

export interface ChronoStats {
  mean_fps: number
  median_fps: number
  min_fps: number
  max_fps: number
  stdDev_fps: number
}

export function computeChronoStats(entries: ChronoEntry[]): ChronoStats {
  if (entries.length === 0) {
    return {
      mean_fps: 0,
      median_fps: 0,
      min_fps: 0,
      max_fps: 0,
      stdDev_fps: 0,
    }
  }

  const values = entries.map((entry) => entry.speed_fps).sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const mid = Math.floor(values.length / 2)
  const median = values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid]

  return {
    mean_fps: mean,
    median_fps: median,
    min_fps: values[0],
    max_fps: values[values.length - 1],
    stdDev_fps: Math.sqrt(variance),
  }
}
