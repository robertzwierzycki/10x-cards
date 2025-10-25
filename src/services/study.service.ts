/**
 * Study Service
 *
 * Provides business logic for study mode operations including:
 * - Study session initialization
 * - Spaced repetition algorithm (SM-2)
 * - Review processing
 * - Study statistics
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

import type { Database } from "@/db/database.types";
import type {
  StudySessionDTO,
  StudyCardDTO,
  ReviewResponseDTO,
  ReviewRating,
  StudyState,
  StudyStatsDTO,
} from "@/types";

/**
 * Custom error for not found resources
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Custom error for forbidden access
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * SM-2 Algorithm calculation result
 */
interface SM2Calculation {
  easeFactor: number;
  interval: number;
  repetition: number;
  nextReviewDate: Date;
  state: StudyState;
}

/**
 * Study record data for algorithm processing
 */
interface StudyRecordData {
  id: string;
  difficulty: number | null;
  stability: number | null;
  state: string | null;
  lapses: number | null;
  last_review_date: string | null;
}

/**
 * Due card with nested flashcard data from Supabase JOIN
 */
interface DueCardWithFlashcard {
  id: string;
  flashcard_id: string;
  state: string | null;
  flashcards: {
    front: string;
    back: string;
  };
}

/**
 * Service class for study mode operations
 */
export class StudyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Validates deck ownership
   *
   * @param userId - UUID of the authenticated user
   * @param deckId - UUID of the deck to validate
   * @returns true if user owns deck, throws error otherwise
   * @throws NotFoundError if deck doesn't exist
   * @throws ForbiddenError if user doesn't own deck
   */
  private async validateDeckOwnership(userId: string, deckId: string): Promise<boolean> {
    const { data: deck, error } = await this.supabase
      .from("decks")
      .select("id, user_id")
      .eq("id", deckId)
      .maybeSingle();

    if (error) {
      console.error("[StudyService] Error checking deck ownership:", error);
      throw new Error("Failed to verify deck ownership");
    }

    if (!deck) {
      throw new NotFoundError("Deck not found");
    }

    if (deck.user_id !== userId) {
      throw new ForbiddenError("Access denied");
    }

    return true;
  }

  /**
   * Initializes study records for flashcards without existing records
   *
   * @param userId - UUID of the authenticated user
   * @param flashcardIds - Array of flashcard UUIDs to initialize
   * @returns Number of records created
   *
   * @remarks
   * Creates initial study records with:
   * - state: "new"
   * - due_date: NOW (immediately available)
   * - difficulty: 5.0 (SM-2 default)
   * - stability: null (will be set after first review)
   * - lapses: 0
   */
  async initializeStudyRecords(userId: string, flashcardIds: string[]): Promise<number> {
    if (flashcardIds.length === 0) {
      return 0;
    }

    try {
      // Batch insert study records
      const records = flashcardIds.map((flashcardId) => ({
        user_id: userId,
        flashcard_id: flashcardId,
        state: "new",
        due_date: new Date().toISOString(),
        difficulty: 5.0,
        stability: null,
        lapses: 0,
      }));

      const { error, count } = await this.supabase.from("study_records").insert(records).select();

      if (error) {
        console.error("[StudyService] Error initializing study records:", error);
        throw new Error("Failed to initialize study records");
      }

      return count || 0;
    } catch (error) {
      console.error("[StudyService] Unexpected error in initializeStudyRecords:", error);
      throw error;
    }
  }

  /**
   * Gets due cards for a study session
   *
   * @param userId - UUID of the authenticated user
   * @param deckId - UUID of the deck to study
   * @param limit - Maximum number of cards to return
   * @returns Array of study cards with metadata
   *
   * @remarks
   * - Automatically initializes study records for new flashcards
   * - Returns cards where due_date <= NOW
   * - Prioritizes new cards, then by due_date (oldest first)
   * - Includes flashcard content and study metadata
   */
  async getDueCards(userId: string, deckId: string, limit: number): Promise<StudyCardDTO[]> {
    try {
      // 1. Validate deck ownership
      await this.validateDeckOwnership(userId, deckId);

      // 2. Get all flashcards in the deck
      const { data: flashcards, error: flashcardsError } = await this.supabase
        .from("flashcards")
        .select("id")
        .eq("deck_id", deckId);

      if (flashcardsError) {
        console.error("[StudyService] Error fetching flashcards:", flashcardsError);
        throw new Error("Failed to fetch flashcards");
      }

      if (!flashcards || flashcards.length === 0) {
        return [];
      }

      const flashcardIds = flashcards.map((f) => f.id);

      // 3. Check which flashcards don't have study records
      const { data: existingRecords, error: recordsError } = await this.supabase
        .from("study_records")
        .select("flashcard_id")
        .eq("user_id", userId)
        .in("flashcard_id", flashcardIds);

      if (recordsError) {
        console.error("[StudyService] Error checking existing records:", recordsError);
        throw new Error("Failed to check study records");
      }

      const existingFlashcardIds = new Set(existingRecords?.map((r) => r.flashcard_id) || []);
      const newFlashcardIds = flashcardIds.filter((id) => !existingFlashcardIds.has(id));

      // 4. Initialize study records for new flashcards
      if (newFlashcardIds.length > 0) {
        await this.initializeStudyRecords(userId, newFlashcardIds);
      }

      // 5. Fetch due cards with flashcard content
      const now = new Date().toISOString();
      const { data: dueCards, error: dueCardsError } = await this.supabase
        .from("study_records")
        .select(
          `
          id,
          flashcard_id,
          state,
          flashcards!inner (
            front,
            back
          )
        `
        )
        .eq("user_id", userId)
        .in("flashcard_id", flashcardIds)
        .lte("due_date", now)
        .order("state", { ascending: false }) // new cards first
        .order("due_date", { ascending: true }) // oldest due first
        .limit(limit);

      if (dueCardsError) {
        console.error("[StudyService] Error fetching due cards:", dueCardsError);
        throw new Error("Failed to fetch due cards");
      }

      // 6. Format response
      const typedDueCards = dueCards as unknown as DueCardWithFlashcard[];
      return (typedDueCards || []).map((card) => ({
        flashcard_id: card.flashcard_id,
        front: card.flashcards.front,
        back: card.flashcards.back,
        study_record_id: card.id,
        state: (card.state as StudyState) || "new",
      }));
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      console.error("[StudyService] Unexpected error in getDueCards:", error);
      throw error;
    }
  }

  /**
   * Initializes a study session for a deck
   *
   * @param userId - UUID of the authenticated user
   * @param deckId - UUID of the deck to study
   * @param limit - Maximum cards to include
   * @returns Complete study session DTO
   */
  async initializeSession(userId: string, deckId: string, limit: number): Promise<StudySessionDTO> {
    try {
      // Get deck details
      const { data: deck, error: deckError } = await this.supabase
        .from("decks")
        .select("id, name")
        .eq("id", deckId)
        .eq("user_id", userId)
        .single();

      if (deckError || !deck) {
        throw new NotFoundError("Deck not found");
      }

      // Get due cards
      const cardsDue = await this.getDueCards(userId, deckId, limit);

      return {
        session_id: randomUUID(),
        deck_id: deckId,
        deck_name: deck.name,
        cards_due: cardsDue,
        total_due: cardsDue.length,
        session_started_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      console.error("[StudyService] Unexpected error in initializeSession:", error);
      throw error;
    }
  }

  /**
   * Maps ReviewRating to SM-2 quality score
   *
   * @param rating - User's rating of card recall
   * @returns Quality score (0-5 scale)
   *
   * @remarks
   * SM-2 mapping:
   * - "again" → 0 (complete blackout)
   * - "good" → 3 (correct response with hesitation)
   * - "easy" → 5 (perfect response)
   */
  private mapRatingToQuality(rating: ReviewRating): number {
    switch (rating) {
      case "again":
        return 0;
      case "good":
        return 3;
      case "easy":
        return 5;
    }
  }

  /**
   * Calculates next review using SM-2 algorithm
   *
   * @param current - Current study record data
   * @param rating - User's rating
   * @returns Calculation result with next review date and updated parameters
   *
   * @remarks
   * SM-2 Algorithm:
   * - EF (Ease Factor) starts at 2.5
   * - Quality 0-2: Reset to learning, interval = 1 day
   * - Quality 3+: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   * - Interval: First = 1 day, Second = 6 days, Subsequent = interval * EF
   */
  private calculateSM2(current: StudyRecordData, rating: ReviewRating): SM2Calculation {
    const quality = this.mapRatingToQuality(rating);

    // Get current values or defaults
    let easeFactor = current.difficulty || 2.5;
    let repetition = current.stability ? Math.round(current.stability) : 0;
    let interval = 1;

    // Calculate new ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Minimum EF is 1.3

    let state: StudyState;

    if (quality < 3) {
      // Failed recall - reset to learning
      repetition = 0;
      interval = 1;
      state = current.state === "new" ? "learning" : "relearning";
    } else {
      // Successful recall
      repetition += 1;

      if (repetition === 1) {
        interval = 1;
        state = "learning";
      } else if (repetition === 2) {
        interval = 6;
        state = "learning";
      } else {
        // Use previous interval stored in stability
        const prevInterval = current.stability || 6;
        interval = Math.round(prevInterval * easeFactor);
        state = "review";
      }
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      easeFactor,
      interval,
      repetition,
      nextReviewDate,
      state,
    };
  }

  /**
   * Processes a review submission
   *
   * @param userId - UUID of the authenticated user
   * @param studyRecordId - UUID of the study record
   * @param flashcardId - UUID of the flashcard (for verification)
   * @param rating - User's rating
   * @returns Updated review response
   * @throws NotFoundError if study record doesn't exist
   * @throws ForbiddenError if user doesn't own the record
   */
  async processReview(
    userId: string,
    studyRecordId: string,
    flashcardId: string,
    rating: ReviewRating
  ): Promise<ReviewResponseDTO> {
    try {
      // 1. Fetch study record with ownership check
      const { data: record, error: fetchError } = await this.supabase
        .from("study_records")
        .select("*")
        .eq("id", studyRecordId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !record) {
        throw new NotFoundError("Study record not found");
      }

      // 2. Verify flashcard_id matches
      if (record.flashcard_id !== flashcardId) {
        throw new Error("Flashcard ID does not match study record");
      }

      // 3. Calculate next review using SM-2
      const calculation = this.calculateSM2(record, rating);

      // 4. Update study record
      const updates = {
        difficulty: calculation.easeFactor,
        stability: calculation.interval,
        state: calculation.state,
        due_date: calculation.nextReviewDate.toISOString(),
        last_review_date: new Date().toISOString(),
        lapses: rating === "again" ? (record.lapses || 0) + 1 : record.lapses,
      };

      const { error: updateError } = await this.supabase.from("study_records").update(updates).eq("id", studyRecordId);

      if (updateError) {
        console.error("[StudyService] Error updating study record:", updateError);
        throw new Error("Failed to update study record");
      }

      // 5. Return response
      return {
        study_record_id: studyRecordId,
        next_review_date: calculation.nextReviewDate.toISOString(),
        stability: calculation.interval,
        difficulty: calculation.easeFactor,
        state: calculation.state,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      console.error("[StudyService] Unexpected error in processReview:", error);
      throw error;
    }
  }

  /**
   * Gets study statistics for a deck
   *
   * @param userId - UUID of the authenticated user
   * @param deckId - UUID of the deck
   * @returns Study statistics DTO
   */
  async getDeckStatistics(userId: string, deckId: string): Promise<StudyStatsDTO> {
    try {
      // 1. Validate deck ownership
      await this.validateDeckOwnership(userId, deckId);

      // 2. Get all flashcard IDs in deck
      const { data: flashcards, error: flashcardsError } = await this.supabase
        .from("flashcards")
        .select("id")
        .eq("deck_id", deckId);

      if (flashcardsError) {
        console.error("[StudyService] Error fetching flashcards for stats:", flashcardsError);
        throw new Error("Failed to fetch flashcards");
      }

      const flashcardIds = flashcards?.map((f) => f.id) || [];
      const totalCards = flashcardIds.length;

      if (totalCards === 0) {
        // Return zeros for empty deck
        return {
          deck_id: deckId,
          total_cards: 0,
          cards_studied_today: 0,
          cards_due_today: 0,
          cards_due_tomorrow: 0,
          average_difficulty: 0,
          retention_rate: 0,
          streak_days: 0,
        };
      }

      // 3. Execute parallel queries for statistics
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const now = new Date().toISOString();

      const [studiedTodayResult, dueTodayResult, dueTomorrowResult, avgDifficultyResult, allRecordsResult] =
        await Promise.all([
          // Cards studied today
          this.supabase
            .from("study_records")
            .select("id", { count: "exact", head: true })
            .in("flashcard_id", flashcardIds)
            .eq("user_id", userId)
            .gte("last_review_date", `${today}T00:00:00`)
            .lte("last_review_date", `${today}T23:59:59`),

          // Cards due today
          this.supabase
            .from("study_records")
            .select("id", { count: "exact", head: true })
            .in("flashcard_id", flashcardIds)
            .eq("user_id", userId)
            .lte("due_date", now),

          // Cards due tomorrow
          this.supabase
            .from("study_records")
            .select("id", { count: "exact", head: true })
            .in("flashcard_id", flashcardIds)
            .eq("user_id", userId)
            .gte("due_date", `${tomorrow}T00:00:00`)
            .lte("due_date", `${tomorrow}T23:59:59`),

          // Average difficulty
          this.supabase
            .from("study_records")
            .select("difficulty")
            .in("flashcard_id", flashcardIds)
            .eq("user_id", userId)
            .not("difficulty", "is", null),

          // All records for retention calculation
          this.supabase
            .from("study_records")
            .select("lapses, last_review_date")
            .in("flashcard_id", flashcardIds)
            .eq("user_id", userId)
            .not("last_review_date", "is", null),
        ]);

      // 4. Calculate metrics
      const cardsStudiedToday = studiedTodayResult.count || 0;
      const cardsDueToday = dueTodayResult.count || 0;
      const cardsDueTomorrow = dueTomorrowResult.count || 0;

      // Average difficulty
      const difficulties = avgDifficultyResult.data || [];
      const averageDifficulty =
        difficulties.length > 0
          ? difficulties.reduce((sum, r) => sum + (r.difficulty || 0), 0) / difficulties.length
          : 0;

      // Retention rate (cards with 0 lapses / total reviewed cards)
      const reviewedCards = allRecordsResult.data || [];
      const retentionRate =
        reviewedCards.length > 0 ? reviewedCards.filter((r) => (r.lapses || 0) === 0).length / reviewedCards.length : 0;

      // Calculate streak (simplified - consecutive days with reviews)
      const streakDays = await this.calculateStudyStreak(userId);

      return {
        deck_id: deckId,
        total_cards: totalCards,
        cards_studied_today: cardsStudiedToday,
        cards_due_today: cardsDueToday,
        cards_due_tomorrow: cardsDueTomorrow,
        average_difficulty: Math.round(averageDifficulty * 100) / 100,
        retention_rate: Math.round(retentionRate * 100) / 100,
        streak_days: streakDays,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      console.error("[StudyService] Unexpected error in getDeckStatistics:", error);
      throw error;
    }
  }

  /**
   * Calculates study streak (consecutive days with reviews)
   *
   * @param userId - UUID of the authenticated user
   * @returns Number of consecutive days
   *
   * @remarks
   * Counts backwards from today to find consecutive days with at least one review
   */
  private async calculateStudyStreak(userId: string): Promise<number> {
    try {
      let streak = 0;
      const checkDate = new Date();

      // Check up to 365 days back (reasonable limit)
      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split("T")[0];

        const { data, error } = await this.supabase
          .from("study_records")
          .select("id")
          .eq("user_id", userId)
          .gte("last_review_date", `${dateStr}T00:00:00`)
          .lte("last_review_date", `${dateStr}T23:59:59`)
          .limit(1);

        if (error) {
          console.error("[StudyService] Error calculating streak:", error);
          break;
        }

        if (!data || data.length === 0) {
          break; // No reviews on this day, streak ends
        }

        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Go back one day
      }

      return streak;
    } catch (error) {
      console.error("[StudyService] Unexpected error in calculateStudyStreak:", error);
      return 0;
    }
  }
}
