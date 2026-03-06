import type { AppState, ArrowBuild, ArrowComponentItem, ComponentTemplate } from "./types"

function ensureComponent(component: Partial<ArrowComponentItem>, fallbackIndex: number): ArrowComponentItem {
  return {
    id: typeof component.id === "string" ? component.id : `component-${fallbackIndex}`,
    name: typeof component.name === "string" ? component.name : "Komponente",
    weight_grain: typeof component.weight_grain === "number" ? component.weight_grain : 0,
    category: component.category ?? "Sonstiges",
    position_mm: typeof component.position_mm === "number" ? component.position_mm : 0,
    length_mm: typeof component.length_mm === "number" ? component.length_mm : undefined,
    material: typeof component.material === "string" ? component.material : undefined,
  }
}

function ensureArrowBuild(build: Partial<ArrowBuild>, fallbackIndex: number): ArrowBuild {
  const components = Array.isArray(build.components) ? build.components.map((entry, index) => ensureComponent(entry, index)) : []

  return {
    id: typeof build.id === "string" ? build.id : `arrow-build-${fallbackIndex}`,
    name: typeof build.name === "string" ? build.name : `Pfeil ${fallbackIndex + 1}`,
    components,
    arrowLength_mm: typeof build.arrowLength_mm === "number" ? build.arrowLength_mm : 760,
    notes: typeof build.notes === "string" ? build.notes : undefined,
    isSystem: Boolean(build.isSystem),
  }
}

function ensureTemplate(template: Partial<ComponentTemplate>, fallbackIndex: number): ComponentTemplate {
  return {
    id: typeof template.id === "string" ? template.id : `template-${fallbackIndex}`,
    name: typeof template.name === "string" ? template.name : `Vorlage ${fallbackIndex + 1}`,
    category: template.category ?? "Sonstiges",
    weight_grain: typeof template.weight_grain === "number" ? template.weight_grain : 0,
    defaultPosition_mm: typeof template.defaultPosition_mm === "number" ? template.defaultPosition_mm : 0,
    defaultLength_mm: typeof template.defaultLength_mm === "number" ? template.defaultLength_mm : undefined,
    material: typeof template.material === "string" ? template.material : undefined,
  }
}

export function migratePersistedState(persisted: unknown, defaults: AppState): AppState {
  const source = typeof persisted === "object" && persisted !== null ? (persisted as Partial<AppState>) : {}

  const arrowBuilds = Array.isArray(source.arrowBuilds) && source.arrowBuilds.length > 0
    ? source.arrowBuilds.map((build, index) => ensureArrowBuild(build, index))
    : defaults.arrowBuilds

  const components = Array.isArray(source.components) && source.components.length > 0
    ? source.components.map((component, index) => ensureComponent(component, index))
    : arrowBuilds.find((build) => build.id === source.activeArrowBuildId)?.components ?? defaults.components

  return {
    ...defaults,
    ...source,
    appSchemaVersion: defaults.appSchemaVersion,
    activeSetup: { ...defaults.activeSetup, ...source.activeSetup },
    advanced: { ...defaults.advanced, ...source.advanced },
    wind: { ...defaults.wind, ...source.wind },
    terrain: { ...defaults.terrain, ...(source.terrain ?? {}) },
    presets: Array.isArray(source.presets) && source.presets.length > 0 ? source.presets : defaults.presets,
    activePresetId: typeof source.activePresetId === "string" ? source.activePresetId : defaults.activePresetId,
    components,
    componentLibrary: Array.isArray(source.componentLibrary) && source.componentLibrary.length > 0
      ? source.componentLibrary.map((template, index) => ensureTemplate(template, index))
      : defaults.componentLibrary,
    arrowBuilds,
    activeArrowBuildId: typeof source.activeArrowBuildId === "string" ? source.activeArrowBuildId : defaults.activeArrowBuildId,
    chronoSessions: Array.isArray(source.chronoSessions) ? source.chronoSessions : defaults.chronoSessions,
    journalEntries: Array.isArray(source.journalEntries) ? source.journalEntries : defaults.journalEntries,
    heightDisplayUnit: source.heightDisplayUnit ?? defaults.heightDisplayUnit,
    uiPreferences: {
      ...defaults.uiPreferences,
      ...(source.uiPreferences ?? {}),
    },
  }
}
