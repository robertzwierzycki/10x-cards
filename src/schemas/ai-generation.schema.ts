/**
 * Validation schemas for AI Flashcard Generation
 * Using Zod for runtime validation and type inference
 */

import { z } from "zod";

/**
 * Schema for AI flashcard generation request
 * Used in: POST /api/ai/generate
 *
 * Enforces:
 * - Minimum 1 character (non-empty after trim)
 * - Maximum 1000 characters
 * - Automatic trimming of whitespace
 * - Sanitization happens in the service layer
 */
export const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required and cannot be empty")
    .max(1000, "Text exceeds 1000 character limit")
    .transform((str) => str.trim()),
});

/**
 * Type inference for validated input
 */
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
