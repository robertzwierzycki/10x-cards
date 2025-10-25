/**
 * Study Mode Validation Schemas
 *
 * Zod schemas for validating study-related API requests
 */

import { z } from "zod";

/**
 * Schema for validating study session URL parameters
 *
 * Validates that the deckId is a valid UUID v4 format
 *
 * Used in: GET /api/study/session/:deckId
 */
export const studySessionParamsSchema = z.object({
  deckId: z.string().uuid("Invalid deck ID format"),
});

/**
 * Type inference for studySessionParams validation
 */
export type StudySessionParams = z.infer<typeof studySessionParamsSchema>;

/**
 * Schema for validating study session query parameters
 *
 * Query parameters for limiting cards in study session
 *
 * Used in: GET /api/study/session/:deckId
 */
export const studySessionQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

/**
 * Type inference for studySessionQuery validation
 */
export type StudySessionQuery = z.infer<typeof studySessionQuerySchema>;

/**
 * Schema for validating review submission request body
 *
 * Validates:
 * - study_record_id: UUID format
 * - flashcard_id: UUID format
 * - rating: One of "again", "good", "easy"
 *
 * Used in: POST /api/study/review
 */
export const submitReviewSchema = z.object({
  study_record_id: z.string().uuid("Invalid study record ID format"),
  flashcard_id: z.string().uuid("Invalid flashcard ID format"),
  rating: z.enum(["again", "good", "easy"], {
    errorMap: () => ({ message: "Rating must be 'again', 'good', or 'easy'" }),
  }),
});

/**
 * Type inference for submitReview validation
 */
export type SubmitReviewBody = z.infer<typeof submitReviewSchema>;

/**
 * Schema for validating study stats URL parameters
 *
 * Validates that the deckId is a valid UUID v4 format
 *
 * Used in: GET /api/study/stats/:deckId
 */
export const studyStatsParamsSchema = z.object({
  deckId: z.string().uuid("Invalid deck ID format"),
});

/**
 * Type inference for studyStatsParams validation
 */
export type StudyStatsParams = z.infer<typeof studyStatsParamsSchema>;
