import type { ArrowComponentItem } from "./types"

export function sumComponentWeight(components: ArrowComponentItem[]): number {
  return components.reduce((sum, item) => sum + item.weight_grain, 0)
}

export function buildDefaultComponent(idPrefix = "comp"): ArrowComponentItem {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    name: "Neue Komponente",
    weight_grain: 0,
    category: "Sonstiges",
  }
}