/**
 * API service for AI Generator
 * Handles all API calls related to flashcard generation
 */

import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponseDTO,
  DeckListDTO,
  DeckDTO,
  CreateDeckCommand,
  BulkCreateFlashcardsCommand,
  BulkCreateFlashcardsResponseDTO,
  ErrorResponseDTO,
} from "@/types";
import type { EditableSuggestion } from "@/types/generator.types";

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public data: ErrorResponseDTO
  ) {
    super(data.error);
    this.name = "APIError";
  }
}

/**
 * Generate flashcards from text using AI
 */
export async function generateFlashcards(text: string): Promise<GenerateFlashcardsResponseDTO> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text } as GenerateFlashcardsCommand),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ErrorResponseDTO;
    throw new APIError(response.status, errorData);
  }

  return (await response.json()) as GenerateFlashcardsResponseDTO;
}

/**
 * Fetch user's decks
 */
export async function fetchDecks(): Promise<DeckListDTO> {
  const response = await fetch("/api/decks?limit=100", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ErrorResponseDTO;
    throw new APIError(response.status, errorData);
  }

  return (await response.json()) as DeckListDTO;
}

/**
 * Create a new deck
 */
export async function createDeck(name: string): Promise<DeckDTO> {
  const response = await fetch("/api/decks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name } as CreateDeckCommand),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ErrorResponseDTO;
    throw new APIError(response.status, errorData);
  }

  return (await response.json()) as DeckDTO;
}

/**
 * Save flashcards to a deck (bulk create)
 */
export async function saveFlashcards(
  deckId: string,
  suggestions: EditableSuggestion[]
): Promise<BulkCreateFlashcardsResponseDTO> {
  const flashcards = suggestions
    .filter((s) => !s.isDeleted)
    .map((s) => ({
      front: s.front,
      back: s.back,
      is_ai_generated: true,
    }));

  const response = await fetch("/api/flashcards/bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      deck_id: deckId,
      flashcards,
    } as BulkCreateFlashcardsCommand),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ErrorResponseDTO;
    throw new APIError(response.status, errorData);
  }

  return (await response.json()) as BulkCreateFlashcardsResponseDTO;
}

/**
 * Rate limit helpers
 */
export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
}

const RATE_LIMIT_KEY = "ai_generator_rate_limit";

/**
 * Get rate limit info from localStorage
 */
export function getRateLimitInfo(): RateLimitInfo | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as RateLimitInfo;

    // Check if reset time has passed
    if (Date.now() >= data.resetTime) {
      localStorage.removeItem(RATE_LIMIT_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Save rate limit info to localStorage
 */
export function saveRateLimitInfo(remaining: number, retryAfter: number): void {
  if (typeof window === "undefined") return;

  const resetTime = Date.now() + retryAfter * 1000;
  const data: RateLimitInfo = {
    remaining,
    resetTime,
  };

  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Clear rate limit info from localStorage
 */
export function clearRateLimitInfo(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch {
    // Ignore localStorage errors
  }
}
