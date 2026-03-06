import type { JournalEntry, SetupSnapshot } from "./types"

export function buildSetupSnapshot(input: SetupSnapshot): SetupSnapshot {
  return {
    setup: { ...input.setup },
    advanced: { ...input.advanced },
    wind: { ...input.wind },
    activeArrowBuildId: input.activeArrowBuildId,
    activeArrowBuildName: input.activeArrowBuildName,
  }
}

export function buildJournalEntry(title: string, notes: string, weather: string, snapshot: SetupSnapshot): JournalEntry {
  return {
    id: `journal-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title,
    createdAt: new Date().toISOString(),
    notes,
    weather,
    snapshot: buildSetupSnapshot(snapshot),
  }
}
