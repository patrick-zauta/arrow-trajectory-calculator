import type { ArrowBuild, ArrowComponentItem } from "./types"

const GRAIN_TO_GRAM = 0.0647989

export function sumComponentWeight(components: ArrowComponentItem[]): number {
  return components.reduce((sum, item) => sum + item.weight_grain, 0)
}

export function sumComponentWeightByCategory(components: ArrowComponentItem[]): Array<{
  category: ArrowComponentItem["category"]
  weight_grain: number
}> {
  const totals = new Map<ArrowComponentItem["category"], number>()

  components.forEach((component) => {
    totals.set(component.category, (totals.get(component.category) ?? 0) + component.weight_grain)
  })

  return Array.from(totals.entries()).map(([category, weight_grain]) => ({
    category,
    weight_grain,
  }))
}

export function defaultPositionForCategory(category: ArrowComponentItem["category"], arrowLengthMm = 760): number {
  switch (category) {
    case "Nocke":
      return 10
    case "Vanes":
      return 90
    case "Wrap":
      return 140
    case "Shaft":
      return arrowLengthMm / 2
    case "Insert":
      return arrowLengthMm - 25
    case "Spitze":
      return arrowLengthMm + 10
    default:
      return arrowLengthMm / 2
  }
}

export function buildDefaultComponent(idPrefix = "comp", arrowLengthMm = 760): ArrowComponentItem {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    name: "Neue Komponente",
    weight_grain: 0,
    category: "Sonstiges",
    position_mm: arrowLengthMm / 2,
    length_mm: 20,
  }
}

export interface FocResult {
  totalWeightGrain: number
  totalWeightGram: number
  balancePointMm: number
  focPercent: number
  rating: string
}

export function computeFoc(build: ArrowBuild): FocResult {
  const totalWeightGrain = sumComponentWeight(build.components)
  const totalMoment = build.components.reduce((sum, component) => sum + component.weight_grain * component.position_mm, 0)
  const balancePointMm = totalWeightGrain > 0 ? totalMoment / totalWeightGrain : build.arrowLength_mm / 2
  const focPercent = ((balancePointMm - build.arrowLength_mm / 2) / build.arrowLength_mm) * 100

  let rating = "neutral"
  if (focPercent >= 18) {
    rating = "sehr frontlastig"
  } else if (focPercent >= 10) {
    rating = "ausgewogen"
  } else if (focPercent > 0) {
    rating = "leicht frontlastig"
  } else {
    rating = "hecklastig"
  }

  return {
    totalWeightGrain,
    totalWeightGram: totalWeightGrain * GRAIN_TO_GRAM,
    balancePointMm,
    focPercent,
    rating,
  }
}
