import type { FastTrainingSession, JournalEntry, JournalRound, SetupSnapshot } from "./types"

export function buildSetupSnapshot(input: SetupSnapshot): SetupSnapshot {
  return {
    setup: { ...input.setup },
    advanced: { ...input.advanced },
    wind: { ...input.wind },
    activeArrowBuildId: input.activeArrowBuildId,
    activeArrowBuildName: input.activeArrowBuildName,
  }
}

export function buildJournalRound(arrowCount: number, note?: string): JournalRound {
  return {
    id: `round-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    arrowCount,
    note: note?.trim() ? note.trim() : undefined,
  }
}

export function buildJournalEntry(
  title: string,
  notes: string,
  weather: string,
  snapshot: SetupSnapshot,
  training?: {
    arrowsPerRound?: number
    roundCount?: number
    rounds?: JournalRound[]
  },
): JournalEntry {
  const rounds = training?.rounds?.map((round) => ({ ...round })) ?? []
  const arrowsPerRound = training?.arrowsPerRound ?? (rounds[0]?.arrowCount ?? 8)
  const roundCount = training?.roundCount ?? rounds.length
  const totalArrows = rounds.length > 0
    ? rounds.reduce((sum, round) => sum + round.arrowCount, 0)
    : arrowsPerRound * roundCount

  return {
    id: `journal-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title,
    createdAt: new Date().toISOString(),
    notes,
    weather,
    arrowsPerRound,
    roundCount,
    totalArrows,
    rounds,
    snapshot: buildSetupSnapshot(snapshot),
  }
}

export function createDefaultFastTrainingSession(): FastTrainingSession {
  return {
    active: false,
    title: "Training",
    weather: "trocken, wenig Wind",
    notes: "",
    arrowsPerRound: 8,
    rounds: [],
    startedAt: null,
  }
}
