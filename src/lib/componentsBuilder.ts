import type { ArrowComponentItem } from "./types"

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

export function buildDefaultComponent(idPrefix = "comp"): ArrowComponentItem {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    name: "Neue Komponente",
    weight_grain: 0,
    category: "Sonstiges",
  }
}
