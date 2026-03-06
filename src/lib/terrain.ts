import type { TerrainProfile } from "./types"
import type { TrajectoryPoint } from "../types/ballistics"

const DEG_TO_RAD = Math.PI / 180

export function terrainHeightAtDistance(profile: TerrainProfile, distanceM: number): number {
  if (!profile.enabled) {
    return 0
  }

  return Math.tan(profile.slope_deg * DEG_TO_RAD) * distanceM + profile.offset_m
}

export function findTerrainImpact(points: TrajectoryPoint[], profile: TerrainProfile): { xM: number; terrainY: number } | null {
  if (!profile.enabled) {
    return null
  }

  for (const point of points) {
    const terrainY = terrainHeightAtDistance(profile, point.xM)
    if (point.xM > 0 && point.yM <= terrainY) {
      return { xM: point.xM, terrainY }
    }
  }

  return null
}

export function buildTerrainSeries(maxDistanceM: number, profile: TerrainProfile, steps = 80): Array<{ xM: number; terrainY: number }> {
  const rows: Array<{ xM: number; terrainY: number }> = []
  for (let index = 0; index <= steps; index += 1) {
    const xM = maxDistanceM <= 0 ? 0 : (maxDistanceM / steps) * index
    rows.push({ xM, terrainY: terrainHeightAtDistance(profile, xM) })
  }
  return rows
}
