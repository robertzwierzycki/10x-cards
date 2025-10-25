/**
 * Zod validation schemas for AI Generator
 */

import { z } from "zod";

// ============================================
// Input Validation Schemas
// ============================================

/**
 * Schema for text input validation
 * - Minimum 1 character after trim
 * - Maximum 1000 characters
 */
export const textInputSchema = z
  .string()
  .trim()
  .min(1, "Tekst nie może być pusty")
  .max(1000, "Tekst nie może przekraczać 1000 znaków");

/**
 * Schema for flashcard content (front/back)
 * - Minimum 1 character after trim
 * - Maximum 5000 characters
 */
export const flashcardContentSchema = z
  .string()
  .trim()
  .min(1, "Pole nie może być puste")
  .max(5000, "Pole nie może przekraczać 5000 znaków");

/**
 * Schema for new deck name
 * - Minimum 1 character after trim
 * - Maximum 255 characters
 */
export const deckNameSchema = z
  .string()
  .trim()
  .min(1, "Nazwa talii nie może być pusta")
  .max(255, "Nazwa talii nie może przekraczać 255 znaków");

// ============================================
// Editable Suggestion Schema
// ============================================

/**
 * Schema for validating editable suggestion
 */
export const editableSuggestionSchema = z.object({
  id: z.string(),
  front: flashcardContentSchema,
  back: flashcardContentSchema,
  isDeleted: z.boolean(),
});

/**
 * Schema for array of suggestions
 */
export const suggestionsArraySchema = z.array(editableSuggestionSchema).min(1, "Musisz mieć przynajmniej jedną fiszkę");

// ============================================
// Type exports from schemas
// ============================================

export type TextInputSchema = z.infer<typeof textInputSchema>;
export type FlashcardContentSchema = z.infer<typeof flashcardContentSchema>;
export type DeckNameSchema = z.infer<typeof deckNameSchema>;
export type EditableSuggestionSchema = z.infer<typeof editableSuggestionSchema>;
