import type { SupportPoint } from "../types/ballistics"

export function supportPointsToCsv(points: SupportPoint[]): string {
  const header = "target_distance_m,effective_distance_m,height_cm"
  const rows = points.map((point) =>
    [
      point.targetDistanceM.toFixed(3),
      point.effectiveDistanceM.toFixed(3),
      point.heightCm.toFixed(3),
    ].join(","),
  )

  return [header, ...rows].join("\n")
}