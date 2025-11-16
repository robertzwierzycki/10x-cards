/**
 * Deck Validation Schemas
 *
 * Zod schemas for validating deck-related API requests
 */

import { z } from "zod";

/**
 * Schema for validating deck ID parameter in URL path
 *
 * Validates that the ID is a valid UUID v4 format
 *
 * Used in: GET /api/decks/:id
 */
export const getDeckParamsSchema = z.object({
  id: z.string().uuid("Invalid deck ID format"),
});

/**
 * Type inference for getDeckParams validation
 */
export type GetDeckParams = z.infer<typeof getDeckParamsSchema>;

/**
 * Schema for validating deck list query parameters
 *
 * Query parameters for paginating and sorting deck lists
 *
 * Used in: GET /api/decks
 */
export const deckListQuerySchema = z.object({
  page: z.coerce.number().min(1).nullish().default(1),
  limit: z.coerce.number().min(1).max(100).nullish().default(20),
  sort: z.enum(["name", "created_at", "updated_at"]).nullish().default("updated_at"),
  order: z.enum(["asc", "desc"]).nullish().default("desc"),
});

/**
 * Type inference for deckListQuery validation
 */
export type DeckListQuery = z.infer<typeof deckListQuerySchema>;

/**
 * Schema for validating create deck request body
 *
 * Validates deck name: required, 1-255 characters, automatically trimmed
 *
 * Used in: POST /api/decks
 */
export const createDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name is required")
    .max(255, "Deck name must be less than 255 characters")
    .transform((val) => val.trim()),
});

/**
 * Type inference for createDeck validation
 */
export type CreateDeckBody = z.infer<typeof createDeckSchema>;

/**
 * Schema for validating update deck URL parameters
 *
 * Validates that the ID is a valid UUID v4 format
 *
 * Used in: PUT /api/decks/:id
 */
export const updateDeckParamsSchema = z.object({
  id: z.string().uuid("Invalid deck ID format"),
});

/**
 * Type inference for updateDeckParams validation
 */
export type UpdateDeckParams = z.infer<typeof updateDeckParamsSchema>;

/**
 * Schema for validating update deck request body
 *
 * Validates deck name: required, 1-255 characters, automatically trimmed
 *
 * Used in: PUT /api/decks/:id
 */
export const updateDeckBodySchema = z.object({
  name: z
    .string()
    .min(1, "Deck name is required")
    .max(255, "Deck name must be less than 255 characters")
    .transform((val) => val.trim()),
});

/**
 * Type inference for updateDeckBody validation
 */
export type UpdateDeckBody = z.infer<typeof updateDeckBodySchema>;

/**
 * Schema for validating delete deck URL parameters
 *
 * Validates that the ID is a valid UUID v4 format
 *
 * Used in: DELETE /api/decks/:id
 */
export const deleteDeckParamsSchema = z.object({
  id: z.string().uuid("Invalid deck ID format"),
});

/**
 * Type inference for deleteDeckParams validation
 */
export type DeleteDeckParams = z.infer<typeof deleteDeckParamsSchema>;

// ============================================
// Frontend Form Schemas
// ============================================

/**
 * Schema for deck name validation in forms (create and edit)
 * Used in: CreateDeckDialog, EditDeckDialog
 *
 * - Required: minimum 1 character after trim
 * - Maximum: 255 characters
 * - Auto-trims whitespace
 */
export const deckNameFormSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa talii jest wymagana")
    .max(255, "Nazwa talii nie może przekraczać 255 znaków")
    .transform((val) => val.trim()),
});

/**
 * Type inference from deck name form schema
 */
export type DeckNameFormData = z.infer<typeof deckNameFormSchema>;
