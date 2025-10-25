/**
 * DTO (Data Transfer Object) and Command Model Types
 *
 * This file contains all type definitions for API requests and responses,
 * derived from the database models defined in src/db/database.types.ts
 */

import type { Tables } from "./db/database.types";

// ============================================
// Base Database Types
// ============================================

type Deck = Tables<"decks">;
type Flashcard = Tables<"flashcards">;
type Profile = Tables<"profiles">;
// StudyRecord type will be used when implementing study-related endpoints
// type StudyRecord = Tables<"study_records">;

// ============================================
// Common Types
// ============================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: string;
  details?: unknown[];
  retry_after?: number;
}

/**
 * Study state enum matching SR algorithm states
 */
export type StudyState = "new" | "learning" | "review" | "relearning";

/**
 * Review rating enum for study mode
 */
export type ReviewRating = "again" | "good" | "easy";

// ============================================
// Deck DTOs and Commands
// ============================================

/**
 * Deck item in list response with flashcard count
 * Used in: GET /api/decks
 */
export interface DeckDTO extends Pick<Deck, "id" | "name" | "created_at" | "updated_at"> {
  flashcard_count: number;
}

/**
 * Paginated deck list response
 * Used in: GET /api/decks
 */
export interface DeckListDTO {
  data: DeckDTO[];
  pagination: PaginationDTO;
}

/**
 * Full deck with flashcards
 * Used in: GET /api/decks/:id
 */
export interface DeckWithFlashcardsDTO extends Pick<Deck, "id" | "name" | "created_at" | "updated_at"> {
  flashcards: FlashcardDTO[];
}

/**
 * Command to create a new deck
 * Used in: POST /api/decks
 */
export interface CreateDeckCommand {
  name: string; // 1-255 characters, trimmed
}

/**
 * Command to update deck name
 * Used in: PUT /api/decks/:id
 */
export interface UpdateDeckCommand {
  name: string; // 1-255 characters, trimmed
}

// ============================================
// Flashcard DTOs and Commands
// ============================================

/**
 * Flashcard DTO with all fields
 * Used in multiple endpoints
 */
export type FlashcardDTO = Flashcard;

/**
 * Paginated flashcard list response
 * Used in: GET /api/decks/:deckId/flashcards
 */
export interface FlashcardListDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

/**
 * Command to create a single flashcard
 * Used in: POST /api/decks/:deckId/flashcards
 */
export interface CreateFlashcardCommand {
  front: string; // 1-5000 characters, non-empty after trim
  back: string; // 1-5000 characters, non-empty after trim
}

/**
 * Command to create multiple flashcards in bulk
 * Used in: POST /api/flashcards/bulk
 */
export interface BulkCreateFlashcardsCommand {
  deck_id: string; // UUID of the target deck
  flashcards: {
    front: string; // 1-5000 characters
    back: string; // 1-5000 characters
    is_ai_generated: boolean; // Marks AI-generated cards for metrics
  }[];
}

/**
 * Response for bulk flashcard creation
 * Used in: POST /api/flashcards/bulk response
 */
export interface BulkCreateFlashcardsResponseDTO {
  created: number;
  flashcards: Pick<Flashcard, "id" | "deck_id" | "front" | "back" | "is_ai_generated" | "created_at">[];
}

/**
 * Command to update flashcard content
 * Used in: PUT /api/flashcards/:id
 */
export interface UpdateFlashcardCommand {
  front: string; // 1-5000 characters, non-empty after trim
  back: string; // 1-5000 characters, non-empty after trim
}

// ============================================
// AI Generation DTOs
// ============================================

/**
 * Command to generate flashcards from text
 * Used in: POST /api/ai/generate
 */
export interface GenerateFlashcardsCommand {
  text: string; // 1-1000 characters, auto-truncated if exceeded
}

/**
 * AI-generated flashcard suggestion
 */
export interface FlashcardSuggestion {
  front: string;
  back: string;
}

/**
 * Response with AI-generated flashcard suggestions
 * Used in: POST /api/ai/generate response
 */
export interface GenerateFlashcardsResponseDTO {
  suggestions: FlashcardSuggestion[];
  count: number;
  truncated: boolean; // Indicates if input was truncated
}

// ============================================
// Study Mode DTOs and Commands
// ============================================

/**
 * Card due for study with associated metadata
 */
export interface StudyCardDTO {
  flashcard_id: string;
  front: string;
  back: string;
  study_record_id: string;
  state: StudyState;
}

/**
 * Study session initialization response
 * Used in: GET /api/study/session/:deckId
 */
export interface StudySessionDTO {
  session_id: string;
  deck_id: string;
  deck_name: string;
  cards_due: StudyCardDTO[];
  total_due: number;
  session_started_at: string; // ISO 8601 timestamp
}

/**
 * Command to submit a review rating
 * Used in: POST /api/study/review
 */
export interface SubmitReviewCommand {
  study_record_id: string;
  flashcard_id: string;
  rating: ReviewRating;
}

/**
 * Response after submitting a review
 * Used in: POST /api/study/review response
 */
export interface ReviewResponseDTO {
  study_record_id: string;
  next_review_date: string; // ISO 8601 timestamp
  stability: number;
  difficulty: number;
  state: StudyState;
}

/**
 * Study statistics for a deck
 * Used in: GET /api/study/stats/:deckId
 */
export interface StudyStatsDTO {
  deck_id: string;
  total_cards: number;
  cards_studied_today: number;
  cards_due_today: number;
  cards_due_tomorrow: number;
  average_difficulty: number;
  retention_rate: number; // 0.0 to 1.0
  streak_days: number;
}

// ============================================
// Metrics DTOs
// ============================================

/**
 * AI adoption metrics (KSM 2)
 * Used in: GET /api/metrics/ai-adoption
 */
export interface AIAdoptionMetricsDTO {
  total_active_flashcards: number;
  ai_generated_active_flashcards: number;
  adoption_rate: number; // 0.0 to 1.0
  meets_target: boolean;
  target_rate: number; // 0.75 for MVP
}

/**
 * Period options for metrics queries
 */
export type MetricsPeriod = "day" | "week" | "month" | "all";

/**
 * AI acceptance rate metrics (KSM 1)
 * Used in: GET /api/metrics/ai-acceptance
 */
export interface AIAcceptanceMetricsDTO {
  period: MetricsPeriod;
  total_suggested: number;
  total_accepted: number;
  total_rejected: number;
  acceptance_rate: number; // 0.0 to 1.0
  meets_target: boolean;
  target_rate: number; // 0.75 for MVP
}

// ============================================
// Profile DTOs and Commands
// ============================================

/**
 * User profile with email from auth
 * Used in: GET /api/profile
 */
export interface ProfileDTO extends Pick<Profile, "id" | "username" | "created_at" | "updated_at"> {
  email: string; // From Supabase Auth, not stored in profiles table
}

/**
 * Command to update user profile
 * Used in: PUT /api/profile
 */
export interface UpdateProfileCommand {
  username?: string; // 3-50 characters, alphanumeric + underscore
}

// ============================================
// System DTOs
// ============================================

/**
 * Service health status
 */
export type ServiceStatus = "connected" | "disconnected" | "available" | "unavailable";

/**
 * Health check response
 * Used in: GET /api/health
 */
export interface HealthCheckDTO {
  status: "healthy" | "unhealthy";
  version: string;
  timestamp: string; // ISO 8601 timestamp
  services: {
    database: ServiceStatus;
    ai_service: ServiceStatus;
  };
}

// ============================================
// Query Parameters DTOs
// ============================================

/**
 * Common sort order options
 */
export type SortOrder = "asc" | "desc";

/**
 * Deck list query parameters
 * Used in: GET /api/decks
 */
export interface DeckListQueryParams {
  page?: number; // default: 1
  limit?: number; // default: 20, max: 100
  sort?: "name" | "created_at" | "updated_at"; // default: 'updated_at'
  order?: SortOrder; // default: 'desc'
}

/**
 * Flashcard list query parameters
 * Used in: GET /api/decks/:deckId/flashcards
 */
export interface FlashcardListQueryParams {
  page?: number; // default: 1
  limit?: number; // default: 50, max: 200
}

/**
 * Study session query parameters
 * Used in: GET /api/study/session/:deckId
 */
export interface StudySessionQueryParams {
  limit?: number; // default: 20, max: 50
}

/**
 * Metrics query parameters
 * Used in: GET /api/metrics/ai-acceptance
 */
export interface MetricsQueryParams {
  period?: MetricsPeriod; // default: 'all'
}

// ============================================
// Type Guards (for runtime validation)
// ============================================

/**
 * Type guard for ReviewRating
 */
export function isValidReviewRating(value: unknown): value is ReviewRating {
  return value === "again" || value === "good" || value === "easy";
}

/**
 * Type guard for StudyState
 */
export function isValidStudyState(value: unknown): value is StudyState {
  return value === "new" || value === "learning" || value === "review" || value === "relearning";
}

/**
 * Type guard for MetricsPeriod
 */
export function isValidMetricsPeriod(value: unknown): value is MetricsPeriod {
  return value === "day" || value === "week" || value === "month" || value === "all";
}

/**
 * Type guard for SortOrder
 */
export function isValidSortOrder(value: unknown): value is SortOrder {
  return value === "asc" || value === "desc";
}
