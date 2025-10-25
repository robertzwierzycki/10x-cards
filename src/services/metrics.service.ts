/**
 * Metrics Service
 *
 * Business logic for calculating AI adoption and acceptance metrics.
 * Implements Key Success Metrics (KSMs) for the AI flashcard generation feature.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { AIAdoptionMetricsDTO, AIAcceptanceMetricsDTO, MetricsPeriod } from "@/types";
import { METRICS_CONFIG, getDateRangeForPeriod } from "@/config/metrics";

export class MetricsService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Calculate AI Adoption Metrics (KSM 2)
   *
   * Measures the percentage of active flashcards that are AI-generated.
   * A flashcard is considered "active" if it has been studied in the last 30 days.
   *
   * @returns AI adoption metrics with target comparison
   * @throws Error if database query fails
   */
  async calculateAIAdoptionMetrics(): Promise<AIAdoptionMetricsDTO> {
    // Calculate the cutoff date for "active" flashcards
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - METRICS_CONFIG.ACTIVE_FLASHCARD_DAYS);
    const cutoffDateISO = cutoffDate.toISOString();

    try {
      // Query to count total active flashcards and AI-generated active flashcards
      // A flashcard is active if it has at least one study record within the last 30 days
      const { data: flashcardsData, error: flashcardsError } = await this.supabase
        .from("flashcards")
        .select(
          `
          id,
          is_ai_generated,
          study_records!inner(
            last_review_date
          )
        `,
          { count: "exact" }
        )
        .gte("study_records.last_review_date", cutoffDateISO);

      if (flashcardsError) {
        console.error("[MetricsService] Error fetching active flashcards:", flashcardsError);
        throw new Error("Failed to fetch active flashcards data");
      }

      // Count total active flashcards and AI-generated ones
      const totalActive = flashcardsData?.length || 0;
      const aiGeneratedActive = flashcardsData?.filter((card) => card.is_ai_generated).length || 0;

      // Calculate adoption rate (avoid division by zero)
      const adoptionRate = totalActive > 0 ? aiGeneratedActive / totalActive : 0;

      // Check if target is met
      const meetsTarget = adoptionRate >= METRICS_CONFIG.TARGET_ADOPTION_RATE;

      return {
        total_active_flashcards: totalActive,
        ai_generated_active_flashcards: aiGeneratedActive,
        adoption_rate: adoptionRate,
        meets_target: meetsTarget,
        target_rate: METRICS_CONFIG.TARGET_ADOPTION_RATE,
      };
    } catch (error) {
      console.error("[MetricsService] Error calculating AI adoption metrics:", error);
      throw error;
    }
  }

  /**
   * Calculate AI Acceptance Metrics (KSM 1)
   *
   * Measures the percentage of AI-generated flashcard suggestions that users accept.
   * Since we don't track rejections (no deleted_at column), we assume all AI-generated
   * flashcards in the database were accepted.
   *
   * Note: This is a simplified implementation. For accurate acceptance tracking,
   * the system should track both suggestions and saves separately.
   *
   * @param period - Time period for metrics calculation
   * @returns AI acceptance metrics with target comparison
   * @throws Error if database query fails
   */
  async calculateAIAcceptanceMetrics(period: MetricsPeriod): Promise<AIAcceptanceMetricsDTO> {
    const { start, end } = getDateRangeForPeriod(period);

    try {
      // Query AI-generated flashcards within the specified period
      const { data: aiFlashcards, error: flashcardsError } = await this.supabase
        .from("flashcards")
        .select("id, is_ai_generated, created_at")
        .eq("is_ai_generated", true)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (flashcardsError) {
        console.error("[MetricsService] Error fetching AI flashcards:", flashcardsError);
        throw new Error("Failed to fetch AI-generated flashcards data");
      }

      // All AI-generated flashcards in DB are considered "accepted"
      // since we don't have a mechanism to track rejections
      const totalSuggested = aiFlashcards?.length || 0;
      const totalAccepted = totalSuggested; // All existing cards were accepted
      const totalRejected = 0; // No tracking for rejections

      // Calculate acceptance rate (avoid division by zero)
      const acceptanceRate = totalSuggested > 0 ? totalAccepted / totalSuggested : 0;

      // Check if target is met
      const meetsTarget = acceptanceRate >= METRICS_CONFIG.TARGET_ACCEPTANCE_RATE;

      return {
        period,
        total_suggested: totalSuggested,
        total_accepted: totalAccepted,
        total_rejected: totalRejected,
        acceptance_rate: acceptanceRate,
        meets_target: meetsTarget,
        target_rate: METRICS_CONFIG.TARGET_ACCEPTANCE_RATE,
      };
    } catch (error) {
      console.error("[MetricsService] Error calculating AI acceptance metrics:", error);
      throw error;
    }
  }
}
