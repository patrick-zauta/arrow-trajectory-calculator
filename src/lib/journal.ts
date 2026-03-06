import type { FastTrainingSession, JournalEntry, JournalRound, SetupSnapshot } from "./types"

export interface JournalIntensityPoint {
  id: string
  label: string
  createdAt: string
  totalArrows: number
  roundCount: number
  totalHits: number
  totalPoints: number
}

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

export function buildDetailedJournalRound(input: {
  arrowCount: number
  hits?: number | null
  points?: number | null
  note?: string
}): JournalRound {
  return {
    id: `round-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    arrowCount: input.arrowCount,
    hits: typeof input.hits === "number" ? input.hits : undefined,
    points: typeof input.points === "number" ? input.points : undefined,
    note: input.note?.trim() ? input.note.trim() : undefined,
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

export function buildJournalIntensitySeries(entries: JournalEntry[], limit = 12): JournalIntensityPoint[] {
  return [...entries]
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
    .slice(-limit)
    .map((entry) => ({
      id: entry.id,
      label: new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit" }).format(new Date(entry.createdAt)),
      createdAt: entry.createdAt,
      totalArrows: entry.totalArrows,
      roundCount: entry.roundCount,
      totalHits: entry.rounds.reduce((sum, round) => sum + (round.hits ?? 0), 0),
      totalPoints: entry.rounds.reduce((sum, round) => sum + (round.points ?? 0), 0),
    }))
}
