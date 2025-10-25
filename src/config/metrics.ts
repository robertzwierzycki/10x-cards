/**
 * Metrics Configuration
 *
 * Configuration values for AI adoption and acceptance metrics tracking.
 * These constants define target rates and thresholds for key success metrics (KSMs).
 */

/**
 * Metrics configuration constants
 */
export const METRICS_CONFIG = {
  /**
   * Target AI adoption rate (KSM 2)
   * Goal: 75% of active flashcards should be AI-generated
   */
  TARGET_ADOPTION_RATE: 0.75,

  /**
   * Target AI acceptance rate (KSM 1)
   * Goal: 75% of AI-generated suggestions should be accepted by users
   */
  TARGET_ACCEPTANCE_RATE: 0.75,

  /**
   * Number of days to consider a flashcard as "active"
   * A flashcard is active if it has been studied within this time period
   */
  ACTIVE_FLASHCARD_DAYS: 30,

  /**
   * Cache TTL in seconds for metrics responses
   * Metrics are cached to reduce database load
   */
  CACHE_TTL_SECONDS: 300, // 5 minutes
} as const;

/**
 * Date range calculation helper for metrics periods
 *
 * @param period - The time period for metrics calculation
 * @returns Start and end dates for the period
 */
export function getDateRangeForPeriod(period: "day" | "week" | "month" | "all"): {
  start: Date;
  end: Date;
} {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "all":
      // Set to epoch (1970-01-01) to include all records
      start.setFullYear(1970, 0, 1);
      break;
  }

  return { start, end };
}
