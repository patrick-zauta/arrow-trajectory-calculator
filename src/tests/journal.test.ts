import { describe, expect, it } from "vitest"
import { buildJournalEntry, buildJournalRound, createDefaultFastTrainingSession } from "../lib/journal"
import { DEFAULT_ADVANCED, DEFAULT_SETUP, DEFAULT_WIND } from "../store/useAppStore"

describe("journal helpers", () => {
  it("builds entries with round and arrow totals", () => {
    const rounds = [buildJournalRound(8), buildJournalRound(8), buildJournalRound(6)]
    const entry = buildJournalEntry("Training", "ok", "trocken", {
      setup: DEFAULT_SETUP,
      advanced: DEFAULT_ADVANCED,
      wind: DEFAULT_WIND,
      activeArrowBuildId: "default-arrow",
      activeArrowBuildName: "Standardpfeil",
    }, {
      arrowsPerRound: 8,
      rounds,
    })

    expect(entry.roundCount).toBe(3)
    expect(entry.totalArrows).toBe(22)
    expect(entry.rounds).toHaveLength(3)
  })

  it("creates a clean default fast training session", () => {
    const session = createDefaultFastTrainingSession()

    expect(session.active).toBe(false)
    expect(session.arrowsPerRound).toBe(8)
    expect(session.rounds).toHaveLength(0)
  })
})
