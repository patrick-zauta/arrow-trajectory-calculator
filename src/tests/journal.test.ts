import { describe, expect, it } from "vitest"
import { buildDetailedJournalRound, buildJournalEntry, buildJournalIntensitySeries, buildJournalRound, createDefaultFastTrainingSession } from "../lib/journal"
import { DEFAULT_ADVANCED, DEFAULT_SETUP, DEFAULT_WIND } from "../store/useAppStore"

describe("journal helpers", () => {
  it("builds entries with round and arrow totals", () => {
    const rounds = [
      buildDetailedJournalRound({ arrowCount: 8, hits: 8, points: 72, note: "sauber" }),
      buildDetailedJournalRound({ arrowCount: 8, hits: 7, points: 68 }),
      buildJournalRound(6),
    ]
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
    expect(entry.rounds[0]?.hits).toBe(8)
    expect(entry.rounds[0]?.points).toBe(72)
  })

  it("creates a clean default fast training session", () => {
    const session = createDefaultFastTrainingSession()

    expect(session.active).toBe(false)
    expect(session.arrowsPerRound).toBe(8)
    expect(session.rounds).toHaveLength(0)
  })

  it("builds an intensity series from journal entries", () => {
    const entries = [
      buildJournalEntry("A", "", "", {
        setup: DEFAULT_SETUP,
        advanced: DEFAULT_ADVANCED,
        wind: DEFAULT_WIND,
        activeArrowBuildId: "default-arrow",
        activeArrowBuildName: "Standardpfeil",
      }, {
        arrowsPerRound: 8,
        rounds: [buildDetailedJournalRound({ arrowCount: 8, hits: 7, points: 65 })],
      }),
      buildJournalEntry("B", "", "", {
        setup: DEFAULT_SETUP,
        advanced: DEFAULT_ADVANCED,
        wind: DEFAULT_WIND,
        activeArrowBuildId: "default-arrow",
        activeArrowBuildName: "Standardpfeil",
      }, {
        arrowsPerRound: 8,
        rounds: [buildDetailedJournalRound({ arrowCount: 8, hits: 8, points: 72 }), buildJournalRound(8)],
      }),
    ]

    const series = buildJournalIntensitySeries(entries)

    expect(series).toHaveLength(2)
    expect(series[0]?.totalArrows).toBe(8)
    expect(series[1]?.totalArrows).toBe(16)
    expect(series[1]?.totalPoints).toBe(72)
  })
})
