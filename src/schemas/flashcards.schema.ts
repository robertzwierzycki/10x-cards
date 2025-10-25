/**
 * Validation schemas for Flashcards API endpoints
 * Using Zod for runtime validation and type inference
 */

import { z } from "zod";

/**
 * Schema for flashcard content (front and back text)
 * Used in POST and PUT requests
 */
export const flashcardContentSchema = z.object({
  front: z.string().min(1, "Front text is required").max(5000, "Front text exceeds 5000 characters").trim(),
  back: z.string().min(1, "Back text is required").max(5000, "Back text exceeds 5000 characters").trim(),
});

/**
 * Schema for pagination query parameters
 * Used in GET requests with pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").optional().default(1),
  limit: z.coerce.number().min(1).max(200, "Limit cannot exceed 200").optional().default(50),
});

/**
 * Schema for UUID validation
 * Used in path parameters
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Schema for creating a single flashcard
 * Used in: POST /api/decks/:deckId/flashcards
 */
export const createFlashcardSchema = z.object({
  params: z.object({
    deckId: uuidSchema,
  }),
  body: flashcardContentSchema,
});

/**
 * Schema for bulk creating flashcards
 * Used in: POST /api/flashcards/bulk
 */
export const bulkCreateFlashcardsSchema = z.object({
  body: z.object({
    deck_id: uuidSchema,
    flashcards: z
      .array(
        z.object({
          front: z.string().min(1).max(5000).trim(),
          back: z.string().min(1).max(5000).trim(),
          is_ai_generated: z.boolean(),
        })
      )
      .min(1, "At least one flashcard is required")
      .max(100, "Cannot create more than 100 flashcards at once"),
  }),
});

/**
 * Schema for updating a flashcard
 * Used in: PUT /api/flashcards/:id
 */
export const updateFlashcardSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: flashcardContentSchema,
});

/**
 * Schema for deleting a flashcard
 * Used in: DELETE /api/flashcards/:id
 */
export const deleteFlashcardSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

/**
 * Schema for getting flashcards by deck ID
 * Used in: GET /api/decks/:deckId/flashcards
 */
export const getFlashcardsByDeckSchema = z.object({
  params: z.object({
    deckId: uuidSchema,
  }),
  query: paginationSchema,
});
