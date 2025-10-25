/**
 * OpenRouter Service Zod Validation Schemas
 *
 * This file contains Zod schemas for validating requests and responses
 * to ensure data integrity and type safety throughout the service.
 */

import { z } from 'zod';

/**
 * Schema for individual flashcard validation
 */
export const flashcardItemSchema = z.object({
  front: z
    .string()
    .min(1, 'Flashcard front text cannot be empty')
    .max(500, 'Flashcard front text cannot exceed 500 characters'),
  back: z
    .string()
    .min(1, 'Flashcard back text cannot be empty')
    .max(500, 'Flashcard back text cannot exceed 500 characters'),
});

/**
 * Schema for flashcard array validation
 */
export const flashcardArraySchema = z.object({
  flashcards: z
    .array(flashcardItemSchema)
    .min(1, 'At least one flashcard must be generated')
    .max(10, 'Cannot generate more than 10 flashcards at once'),
});

/**
 * Schema for validating flashcard generation requests
 */
export const generateRequestSchema = z.object({
  input: z
    .string()
    .min(1, 'Input text cannot be empty')
    .max(1000, 'Input text cannot exceed 1000 characters')
    .transform((val) => val.trim()),
  count: z
    .number()
    .min(1, 'Must generate at least 1 flashcard')
    .max(10, 'Cannot generate more than 10 flashcards')
    .optional()
    .default(5),
});

/**
 * Schema for validating generation options
 */
export const generateOptionsSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .default(0.7),
  maxTokens: z
    .number()
    .min(1)
    .max(4096)
    .optional()
    .default(500),
});

/**
 * Schema for message validation
 */
export const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Message content cannot be empty'),
});

/**
 * Schema for completion options validation
 */
export const completionOptionsSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
});

/**
 * Schema for OpenRouter service configuration
 */
export const openRouterOptionsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().optional(),
  maxRetries: z.number().min(0).max(10).optional(),
  retryDelay: z.number().min(0).max(10000).optional(),
  timeout: z.number().min(1000).max(120000).optional(),
  maxInputLength: z.number().min(1).max(10000).optional(),
  defaultTemperature: z.number().min(0).max(2).optional(),
  defaultMaxTokens: z.number().min(1).max(4096).optional(),
});

/**
 * Schema for API response validation
 */
export const apiResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
      index: z.number(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  created: z.number(),
});

/**
 * Schema for flashcard response validation
 */
export const flashcardResponseSchema = z.object({
  flashcards: z.array(flashcardItemSchema),
  tokensUsed: z.number().nonnegative(),
  modelUsed: z.string(),
  truncated: z.boolean(),
});

/**
 * Type exports for use in the application
 * Note: GenerateOptions interface is exported from types.ts to avoid conflicts
 */
export type FlashcardItem = z.infer<typeof flashcardItemSchema>;
export type FlashcardArray = z.infer<typeof flashcardArraySchema>;
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type GenerateOptionsSchemaType = z.infer<typeof generateOptionsSchema>;
export type MessageSchema = z.infer<typeof messageSchema>;
export type CompletionOptionsSchemaType = z.infer<typeof completionOptionsSchema>;
export type OpenRouterOptionsSchemaType = z.infer<typeof openRouterOptionsSchema>;
export type ApiResponseSchema = z.infer<typeof apiResponseSchema>;
export type FlashcardResponseSchema = z.infer<typeof flashcardResponseSchema>;
